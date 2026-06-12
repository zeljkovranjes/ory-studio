/**
 * Lightweight readiness probes for the bundled Ory services. Each service
 * exposes `/health/ready` (Kratos, Hydra, Keto all do), returning 200 when
 * ready. Used by the Get started page to show stack status at a glance.
 */

/** Build the `/health/ready` URL for a service base URL, tolerating a trailing slash. */
export function healthReadyUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/health/ready`;
}

export interface HealthResult {
  ok: boolean;
  status: number | null;
  error?: string;
}

/** Probe one service's readiness endpoint with a short timeout. Never throws. */
export async function probeHealth(
  baseUrl: string,
  timeoutMs = 2500,
): Promise<HealthResult> {
  try {
    const res = await fetch(healthReadyUrl(baseUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: null, error: (err as Error).message };
  }
}
