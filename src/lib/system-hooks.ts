/**
 * System hooks — the self-injected Kratos webhooks that feed the events store.
 * Idempotent: injection skips containers that already point at the collector.
 */

import { getPath } from "./kratos-config";
import { hookContainerPath } from "./kratos-hooks";
import type { YamlPatch } from "./config-engine";

/** Jsonnet body: identity id + request metadata, nothing sensitive. */
const COLLECTOR_BODY_JSONNET = `function(ctx) {
  identity_id: std.get(std.get(ctx, 'identity', {}), 'id', null),
  user_agent: std.get(std.get(ctx, 'request_headers', {}), 'User-Agent', [null])[0],
  forwarded_for: std.get(std.get(ctx, 'request_headers', {}), 'X-Forwarded-For', [null])[0],
  method: std.get(std.get(ctx, 'flow', {}), 'active', null),
}
`;

export function collectorBodyUrl(): string {
  return `base64://${Buffer.from(COLLECTOR_BODY_JSONNET, "utf8").toString("base64")}`;
}

/** Path that identifies the studio's own analytics collector webhooks. */
export const COLLECTOR_PATH = "/api/internal/events/";

/**
 * True when a webhook URL is one of the studio's internal collector hooks.
 * These are managed automatically and are hidden from the user-facing Actions
 * list so they don't clutter it or get edited/removed by hand.
 */
export function isCollectorHookUrl(url: string | undefined): boolean {
  return !!url && url.includes(COLLECTOR_PATH);
}

/** Flow/timing → collector event name. */
export const SYSTEM_HOOK_TARGETS: {
  flow: string;
  event: string;
}[] = [
  { flow: "registration", event: "signup" },
  { flow: "login", event: "login" },
  { flow: "recovery", event: "recovery" },
  { flow: "verification", event: "verification" },
  { flow: "settings", event: "settings_updated" },
];

interface RawHook {
  hook?: string;
  config?: { url?: string };
}

function collectorHook(url: string, token: string) {
  return {
    hook: "web_hook",
    config: {
      url,
      method: "POST",
      body: collectorBodyUrl(),
      // analytics must never block a user flow
      response: { ignore: true },
      auth: {
        type: "api_key",
        config: { name: "X-Collector-Token", value: token, in: "header" },
      },
    },
  };
}

/**
 * Hook containers to inject into for a flow's `after` timing: the global
 * `after.hooks`, plus every method-specific block already present (e.g.
 * `after.password.hooks`). Kratos IGNORES the global `after.hooks` for any
 * method that defines its own `after.<method>.hooks` (registration's password
 * block holds the `session` hook), so the collector hook must also live in
 * those blocks or it silently never fires. Injecting into both fires the hook
 * exactly once per method (a method uses either its block or the global, never
 * both).
 */
function afterHookContainers(config: unknown, flow: string): (string | undefined)[] {
  const after = getPath<Record<string, unknown>>(
    config,
    ["selfservice", "flows", flow, "after"],
    {},
  );
  const containers: (string | undefined)[] = [undefined]; // global after.hooks
  for (const key of Object.keys(after)) {
    if (key === "hooks") continue;
    const block = after[key];
    if (block && typeof block === "object") containers.push(key);
  }
  return containers;
}

/**
 * Build the patches that add a collector web_hook after each flow.
 * @param config parsed kratos.yml
 * @param baseUrl studio URL reachable from the kratos container
 * @param token shared secret sent as X-Collector-Token
 */
export function buildSystemHookPatches(
  config: unknown,
  baseUrl: string,
  token: string,
): YamlPatch[] {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const patches: YamlPatch[] = [];
  for (const target of SYSTEM_HOOK_TARGETS) {
    const url = `${cleanBase}/api/internal/events/${target.event}`;
    for (const method of afterHookContainers(config, target.flow)) {
      const path = hookContainerPath(target.flow, "after", method);
      const existing = getPath<RawHook[]>(config, path, []);
      if (existing.some((hook) => hook.config?.url === url)) continue;
      patches.push({
        path,
        value: [...existing, collectorHook(url, token)],
      });
    }
  }
  return patches;
}

/** True when no collector-hook patches remain to apply (all containers covered). */
export function systemHooksInstalled(
  config: unknown,
  baseUrl: string,
): boolean {
  // A placeholder token is fine here — installed-ness is keyed on the URL only.
  return buildSystemHookPatches(config, baseUrl, "").length === 0;
}
