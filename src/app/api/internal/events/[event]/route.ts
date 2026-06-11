import { NextRequest, NextResponse } from "next/server";
import { EVENT_NAMES, insertEvent } from "@/lib/events";
import { timingSafeEqual } from "@/lib/constant-time";
import { sha256Hex } from "@/lib/hash";
import { classifyIp } from "@/lib/geo";
import { enabledHttpsStreamUrls } from "@/lib/event-streams";
import { verifyApiKey } from "@/lib/api-keys";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

/** True if the presented token is the env collector token or a valid studio key. */
async function collectorAuthorized(provided: string): Promise<boolean> {
  const envToken = process.env.STUDIO_COLLECTOR_TOKEN;
  if (envToken) {
    // Compare fixed-length digests so timing can't leak the token's length.
    const [a, b] = await Promise.all([
      sha256Hex(provided),
      sha256Hex(envToken),
    ]);
    if (timingSafeEqual(a, b)) return true;
  }
  // Studio-issued API keys (verified by hash lookup).
  return verifyApiKey(provided).catch(() => false);
}

/** Fire-and-forget fan-out to enabled HTTPS event streams. Never blocks. */
async function fanOut(event: string, payload: unknown): Promise<void> {
  try {
    const urls = await enabledHttpsStreamUrls(DEFAULT_TENANT_ID);
    await Promise.allSettled(
      urls.map((url) =>
        fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ event, payload }),
          // Bound each delivery so a slow/hanging stream can't stall the collector.
          signal: AbortSignal.timeout(5000),
        }),
      ),
    );
  } catch {
    // streams are best-effort — a delivery failure must never disturb the flow
  }
}

export const dynamic = "force-dynamic";

/**
 * Collector endpoint for the self-injected Kratos system webhooks.
 * Authenticated by the shared X-Collector-Token header (not by the studio's
 * Basic auth — see middleware matcher).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ event: string }> },
) {
  const provided = request.headers.get("x-collector-token") ?? "";
  if (!provided || !(await collectorAuthorized(provided))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { event } = await params;
  if (!(EVENT_NAMES as readonly string[]).includes(event)) {
    return NextResponse.json({ error: "unknown event" }, { status: 400 });
  }

  let body: {
    identity_id?: string | null;
    user_agent?: string | null;
    forwarded_for?: string | null;
    method?: string | null;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // tolerate empty/non-JSON bodies — record the event anyway
  }

  const ip = body.forwarded_for?.split(",")[0]?.trim() ?? null;
  try {
    await insertEvent({
      eventName: event,
      identityId: body.identity_id ?? null,
      ip,
      userAgent: body.user_agent ?? null,
      geoCountry: classifyIp(ip),
      payload: { method: body.method ?? null },
    });
  } catch (err) {
    // Never bounce the webhook hard enough to disturb Kratos retries.
    console.error("event insert failed:", (err as Error).message);
    return NextResponse.json({ ok: false }, { status: 202 });
  }
  await fanOut(event, { identity_id: body.identity_id ?? null, ip });
  return NextResponse.json({ ok: true });
}
