/**
 * Events store — the durable analytics log behind the Activity pages.
 * Fed by the collector route (Kratos system webhooks). Plain Postgres.
 */

import { Pool } from "pg";

export interface StudioEvent {
  id: string;
  ts: string;
  service: string;
  event_name: string;
  identity_id: string | null;
  ip: string | null;
  user_agent: string | null;
  geo_country: string | null;
  payload: unknown;
}

/** Column headers for the events CSV export. */
export const EVENT_CSV_HEADERS = [
  "timestamp",
  "event",
  "identity_id",
  "method",
  "ip",
  "country",
  "user_agent",
] as const;

/** Map an event to a CSV row matching EVENT_CSV_HEADERS. */
export function eventToCsvRow(event: StudioEvent): (string | null)[] {
  const method = (event.payload as { method?: string } | null)?.method ?? null;
  return [
    event.ts,
    event.event_name,
    event.identity_id,
    method,
    event.ip,
    event.geo_country,
    event.user_agent,
  ];
}

export const EVENT_NAMES = [
  "signup",
  "login",
  "recovery",
  "verification",
  "settings_updated",
] as const;

export const TIME_WINDOWS: Record<string, string> = {
  "1h": "1 hour",
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
};

declare global {
  var __studioEventsPool: Pool | undefined;
  var __studioEventsSchemaReady: Promise<void> | undefined;
}

function pool(): Pool {
  if (!globalThis.__studioEventsPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured");
    }
    globalThis.__studioEventsPool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 4000,
    });
  }
  return globalThis.__studioEventsPool;
}

async function ensureSchema(): Promise<void> {
  if (!globalThis.__studioEventsSchemaReady) {
    globalThis.__studioEventsSchemaReady = (async () => {
      await pool().query(`
        CREATE TABLE IF NOT EXISTS studio_events (
          id BIGSERIAL PRIMARY KEY,
          ts TIMESTAMPTZ NOT NULL DEFAULT now(),
          service TEXT NOT NULL DEFAULT 'kratos',
          event_name TEXT NOT NULL,
          identity_id TEXT,
          ip TEXT,
          user_agent TEXT,
          payload JSONB
        );
        -- additive columns (idempotent) so existing tables gain geo support
        ALTER TABLE studio_events ADD COLUMN IF NOT EXISTS geo_country TEXT;
        ALTER TABLE studio_events ADD COLUMN IF NOT EXISTS geo_city TEXT;
        CREATE INDEX IF NOT EXISTS studio_events_name_ts
          ON studio_events (event_name, ts DESC);
      `);
    })().catch((err) => {
      globalThis.__studioEventsSchemaReady = undefined;
      throw err;
    });
  }
  return globalThis.__studioEventsSchemaReady;
}

export async function insertEvent(input: {
  service?: string;
  eventName: string;
  identityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  geoCountry?: string | null;
  payload?: unknown;
}): Promise<void> {
  await ensureSchema();
  await pool().query(
    `INSERT INTO studio_events (service, event_name, identity_id, ip, user_agent, geo_country, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.service ?? "kratos",
      input.eventName,
      input.identityId ?? null,
      input.ip ?? null,
      input.userAgent ?? null,
      input.geoCountry ?? null,
      input.payload === undefined ? null : JSON.stringify(input.payload),
    ],
  );
}

function windowInterval(window: string): string {
  return TIME_WINDOWS[window] ?? TIME_WINDOWS["24h"];
}

export async function countEvents(
  eventName: string,
  window: string,
): Promise<number> {
  await ensureSchema();
  const result = await pool().query<{ count: string }>(
    `SELECT count(*) AS count FROM studio_events
     WHERE event_name = $1 AND ts > now() - $2::interval`,
    [eventName, windowInterval(window)],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export interface Bucket {
  bucket: string;
  event_name: string;
  count: number;
}

/** Hourly (or daily for long windows) buckets for the combined chart. */
export async function eventBuckets(
  eventNames: string[],
  window: string,
): Promise<Bucket[]> {
  await ensureSchema();
  const unit = window === "7d" || window === "30d" ? "day" : "hour";
  const result = await pool().query<{
    bucket: Date;
    event_name: string;
    count: string;
  }>(
    `SELECT date_trunc($3, ts) AS bucket, event_name, count(*) AS count
     FROM studio_events
     WHERE event_name = ANY($1) AND ts > now() - $2::interval
     GROUP BY 1, 2 ORDER BY 1`,
    [eventNames, windowInterval(window), unit],
  );
  return result.rows.map((row) => ({
    bucket: row.bucket.toISOString(),
    event_name: row.event_name,
    count: Number(row.count),
  }));
}

export interface TrafficSplit {
  browser: number;
  native: number;
  total: number;
}

/** Browser-vs-native split of recent events, classified by user-agent. */
export async function trafficSplit(window: string): Promise<TrafficSplit> {
  await ensureSchema();
  const result = await pool().query<{ browser: string; total: string }>(
    `SELECT
       count(*) FILTER (WHERE user_agent ILIKE '%mozilla%') AS browser,
       count(*) AS total
     FROM studio_events
     WHERE ts > now() - $1::interval`,
    [windowInterval(window)],
  );
  const total = Number(result.rows[0]?.total ?? 0);
  const browser = Number(result.rows[0]?.browser ?? 0);
  return { browser, native: total - browser, total };
}

export interface LocationCount {
  country: string;
  count: number;
}

/** Session/event counts grouped by resolved country (empty until geo capture). */
export async function locationBreakdown(
  window: string,
): Promise<LocationCount[]> {
  await ensureSchema();
  const result = await pool().query<{ country: string; count: string }>(
    `SELECT geo_country AS country, count(*) AS count
     FROM studio_events
     WHERE ts > now() - $1::interval AND geo_country IS NOT NULL
     GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
    [windowInterval(window)],
  );
  return result.rows.map((r) => ({
    country: r.country,
    count: Number(r.count),
  }));
}

export async function listEvents(opts: {
  eventName?: string;
  window: string;
  limit?: number;
}): Promise<StudioEvent[]> {
  await ensureSchema();
  const params: unknown[] = [windowInterval(opts.window)];
  let filter = "";
  if (opts.eventName) {
    params.push(opts.eventName);
    filter = "AND event_name = $2";
  }
  params.push(opts.limit ?? 100);
  const result = await pool().query<StudioEvent>(
    `SELECT id::text, ts::text, service, event_name, identity_id, ip, user_agent, geo_country, payload
     FROM studio_events
     WHERE ts > now() - $1::interval ${filter}
     ORDER BY ts DESC LIMIT $${params.length}`,
    params,
  );
  return result.rows;
}
