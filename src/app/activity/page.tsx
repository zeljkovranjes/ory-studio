import {
  countEvents,
  eventBuckets,
  locationBreakdown,
  trafficSplit,
  type LocationCount,
  type TrafficSplit,
} from "@/lib/events";
import { readKratosRaw } from "@/lib/kratos-config";
import { systemHooksInstalled } from "@/lib/system-hooks";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { Flash } from "@/components/forms";
import { enableCapture } from "./actions";

export const dynamic = "force-dynamic";

const WINDOWS = ["1h", "24h", "7d", "30d"] as const;
const WINDOW_LABELS: Record<string, string> = {
  "1h": "Last hour",
  "24h": "Last 24 Hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

function WindowPicker({ window }: { window: string }) {
  return (
    <div className="mb-4 flex gap-1">
      {WINDOWS.map((value) => (
        <a
          key={value}
          href={`/activity?window=${value}`}
          className={`rounded px-2.5 py-1 text-sm ${
            value === window
              ? "bg-accent-subtle font-medium text-accent-emphasis"
              : "text-fg-muted hover:bg-bg-subtle"
          }`}
        >
          {WINDOW_LABELS[value]}
        </a>
      ))}
    </div>
  );
}

function CombinedChart({
  buckets,
}: {
  buckets: { bucket: string; event_name: string; count: number }[];
}) {
  const keys = [...new Set(buckets.map((b) => b.bucket))].sort();
  if (keys.length === 0) {
    return (
      <EmptyState message="There's not enough traffic to generate meaningful insights." />
    );
  }
  const byBucket = new Map<string, { signup: number; login: number }>(
    keys.map((key) => [key, { signup: 0, login: 0 }]),
  );
  for (const bucket of buckets) {
    const entry = byBucket.get(bucket.bucket);
    if (!entry) continue;
    if (bucket.event_name === "signup") entry.signup = bucket.count;
    if (bucket.event_name === "login") entry.login = bucket.count;
  }
  const max = Math.max(
    1,
    ...[...byBucket.values()].flatMap((entry) => [entry.signup, entry.login]),
  );
  const barWidth = 100 / keys.length;
  return (
    <div>
      <svg viewBox="0 0 100 32" className="h-48 w-full" preserveAspectRatio="none">
        {keys.map((key, index) => {
          const entry = byBucket.get(key)!;
          const x = index * barWidth;
          const signupHeight = (entry.signup / max) * 28;
          const loginHeight = (entry.login / max) * 28;
          return (
            <g key={key}>
              <rect
                x={x + barWidth * 0.15}
                y={30 - signupHeight}
                width={barWidth * 0.3}
                height={signupHeight}
                fill="#3d53f5"
              />
              <rect
                x={x + barWidth * 0.5}
                y={30 - loginHeight}
                width={barWidth * 0.3}
                height={loginHeight}
                fill="#6475f7"
              />
            </g>
          );
        })}
        <line x1="0" y1="30" x2="100" y2="30" stroke="#eee" strokeWidth="0.3" />
      </svg>
      <div className="mt-2 flex justify-between text-xs text-fg-subtle">
        <span>{new Date(keys[0]).toLocaleString()}</span>
        <span>{new Date(keys[keys.length - 1]).toLocaleString()}</span>
      </div>
      <div className="mt-2 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
          Sign-ups
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-muted" />
          Logins
        </span>
      </div>
    </div>
  );
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    warning?: string;
    error?: string;
    window?: string;
  }>;
}) {
  const { window: windowParam, ...flash } = await searchParams;
  const window = WINDOWS.includes(windowParam as (typeof WINDOWS)[number])
    ? (windowParam as string)
    : "24h";

  const config = await readKratosRaw();
  const captureReady =
    !("error" in config) &&
    systemHooksInstalled(
      config,
      process.env.STUDIO_INTERNAL_URL ?? "http://studio:3000",
    );

  let signups = 0;
  let logins = 0;
  let buckets: { bucket: string; event_name: string; count: number }[] = [];
  let traffic: TrafficSplit = { browser: 0, native: 0, total: 0 };
  let locations: LocationCount[] = [];
  let dbError: string | null = null;
  try {
    [signups, logins, buckets, traffic, locations] = await Promise.all([
      countEvents("signup", window),
      countEvents("login", window),
      eventBuckets(["signup", "login"], window),
      trafficSplit(window),
      locationBreakdown(window),
    ]);
  } catch (err) {
    dbError = (err as Error).message;
  }

  return (
    <>
      <PageHeader
        title="Live activity"
        description="Metrics for your instance, captured from authentication flow events."
      />
      <Flash {...flash} />

      {!captureReady ? (
        <Card
          title="Activity capture"
          description="Install the analytics webhooks: a collector hook is added after each self-service flow (registration, login, recovery, verification, settings) in the Kratos config. The hooks never block user flows."
        >
          <form action={enableCapture}>
            <button
              type="submit"
              className="h-8 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
            >
              Enable activity capture
            </button>
          </form>
        </Card>
      ) : null}

      <WindowPicker window={window} />

      {dbError ? (
        <Card>
          <EmptyState
            message={`Events database not reachable (${dbError}). Metrics appear once DATABASE_URL points at the bundle's Postgres.`}
          />
        </Card>
      ) : (
        <>
          <div className="mb-0 grid grid-cols-2 gap-4">
            <Card title="Sign-ups">
              <div className="text-3xl font-semibold">{signups}</div>
              <div className="mt-1 text-sm text-fg-muted">
                {WINDOW_LABELS[window]}
              </div>
            </Card>
            <Card title="Logins">
              <div className="text-3xl font-semibold">{logins}</div>
              <div className="mt-1 text-sm text-fg-muted">
                {WINDOW_LABELS[window]}
              </div>
            </Card>
          </div>
          <Card title="Combined activity">
            <CombinedChart buckets={buckets} />
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card title="Traffic">
              <TrafficPanel traffic={traffic} />
            </Card>
            <Card title="Session location">
              <LocationPanel locations={locations} />
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function TrafficPanel({ traffic }: { traffic: TrafficSplit }) {
  if (traffic.total === 0) {
    return (
      <EmptyState message="There's not enough traffic to generate meaningful insights." />
    );
  }
  const browserPct = Math.round((traffic.browser / traffic.total) * 100);
  const nativePct = 100 - browserPct;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded">
        <span className="bg-accent" style={{ width: `${browserPct}%` }} />
        <span className="bg-accent-muted" style={{ width: `${nativePct}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
          Browser
          <span className="text-fg-muted">{browserPct}%</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-muted" />
          Native
          <span className="text-fg-muted">{nativePct}%</span>
        </span>
      </div>
    </div>
  );
}

function LocationPanel({ locations }: { locations: LocationCount[] }) {
  if (locations.length === 0) {
    return (
      <EmptyState message="No data available. There's not enough traffic to generate meaningful insights." />
    );
  }
  const max = Math.max(...locations.map((l) => l.count));
  return (
    <ul className="space-y-2">
      {locations.map((loc) => (
        <li key={loc.country} className="text-sm">
          <div className="flex justify-between">
            <span>{loc.country}</span>
            <span className="text-fg-muted">{loc.count}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded bg-bg-subtle">
            <span
              className="block h-full bg-accent"
              style={{ width: `${(loc.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
