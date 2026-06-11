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
    const path = hookContainerPath(target.flow, "after");
    const existing = getPath<RawHook[]>(config, path, []);
    if (existing.some((hook) => hook.config?.url === url)) continue;
    patches.push({
      path,
      value: [
        ...existing,
        {
          hook: "web_hook",
          config: {
            url,
            method: "POST",
            body: collectorBodyUrl(),
            // analytics must never block a user flow
            response: { ignore: true },
            auth: {
              type: "api_key",
              config: {
                name: "X-Collector-Token",
                value: token,
                in: "header",
              },
            },
          },
        },
      ],
    });
  }
  return patches;
}

/** True when every flow already has its collector hook. */
export function systemHooksInstalled(
  config: unknown,
  baseUrl: string,
): boolean {
  const cleanBase = baseUrl.replace(/\/$/, "");
  return SYSTEM_HOOK_TARGETS.every((target) => {
    const hooks = getPath<RawHook[]>(
      config,
      hookContainerPath(target.flow, "after"),
      [],
    );
    return hooks.some(
      (hook) =>
        hook.config?.url ===
        `${cleanBase}/api/internal/events/${target.event}`,
    );
  });
}
