/**
 * Event streams — outbound destinations the studio fans events out to, scoped
 * to the active tenant. This is the self-host replacement for Ory Network's
 * Enterprise event streams (HTTPS / AWS SNS). Stored in the studio DB; the
 * collector forwards captured events to enabled HTTPS streams (best-effort).
 */

import { ensureOnce, getPool } from "./db";

export const STREAM_TYPES = ["https", "sns"] as const;

export interface EventStream {
  id: string;
  tenant_id: string;
  name: string;
  type: (typeof STREAM_TYPES)[number];
  url: string;
  enabled: boolean;
  created_at: string;
}

async function ensureSchema(): Promise<void> {
  return ensureOnce("event-streams", async () => {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS studio_event_streams (
        id BIGSERIAL PRIMARY KEY,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'https',
        url TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS studio_event_streams_tenant
        ON studio_event_streams (tenant_id);
    `);
  });
}

export async function listEventStreams(
  tenantId: string,
): Promise<EventStream[]> {
  await ensureSchema();
  const res = await getPool().query<EventStream>(
    `SELECT id::text, tenant_id, name, type, url, enabled, created_at::text
     FROM studio_event_streams WHERE tenant_id = $1 ORDER BY name`,
    [tenantId],
  );
  return res.rows;
}

/** Enabled HTTPS stream URLs for a tenant — used by the collector fan-out. */
export async function enabledHttpsStreamUrls(
  tenantId: string,
): Promise<string[]> {
  await ensureSchema();
  const res = await getPool().query<{ url: string }>(
    `SELECT url FROM studio_event_streams
     WHERE tenant_id = $1 AND enabled = true AND type = 'https'`,
    [tenantId],
  );
  return res.rows.map((r) => r.url);
}

/** Pure validation for an event stream, throwing on the first problem. */
export function validateStreamInput(input: {
  name: string;
  type: string;
  url: string;
}): void {
  if (!input.name.trim()) throw new Error("Stream name is required");
  if (!(STREAM_TYPES as readonly string[]).includes(input.type)) {
    throw new Error("Unknown stream type");
  }
  if (input.type === "https" && !/^https:\/\/.+/.test(input.url)) {
    throw new Error("HTTPS streams require an https:// URL");
  }
  if (input.type === "sns" && !/^arn:aws:sns:/.test(input.url)) {
    throw new Error("SNS streams require an SNS topic ARN (arn:aws:sns:…)");
  }
}

export async function createEventStream(
  tenantId: string,
  input: { name: string; type: string; url: string },
): Promise<void> {
  validateStreamInput(input);
  await ensureSchema();
  await getPool().query(
    `INSERT INTO studio_event_streams (tenant_id, name, type, url)
     VALUES ($1, $2, $3, $4)`,
    [tenantId, input.name.trim(), input.type, input.url.trim()],
  );
}

export async function setEventStreamEnabled(
  tenantId: string,
  id: string,
  enabled: boolean,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE studio_event_streams SET enabled = $3 WHERE tenant_id = $1 AND id = $2::bigint`,
    [tenantId, id, enabled],
  );
}

export async function deleteEventStream(
  tenantId: string,
  id: string,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `DELETE FROM studio_event_streams WHERE tenant_id = $1 AND id = $2::bigint`,
    [tenantId, id],
  );
}
