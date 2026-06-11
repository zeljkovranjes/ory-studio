/** Helpers for Actions & Webhooks — Kratos web_hook entries in kratos.yml. */

import { getPath } from "./kratos-config";

export const HOOK_FLOWS = [
  "login",
  "registration",
  "recovery",
  "settings",
  "verification",
] as const;
export const HOOK_TIMINGS = ["before", "after"] as const;
/** Method-scoped hook containers valid under `after` (plus "all" = flow-level). */
export const HOOK_METHODS = [
  "all",
  "password",
  "oidc",
  "code",
  "webauthn",
  "passkey",
  "totp",
  "profile",
] as const;
export const HOOK_HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;
export const HOOK_AUTH_TYPES = ["none", "basic", "key"] as const;

export interface WebHookEntry {
  flow: string;
  timing: string;
  /** undefined = flow-level hook (applies to every method) */
  method?: string;
  index: number;
  url: string;
  httpMethod: string;
  canInterrupt: boolean;
}

interface RawHook {
  hook?: string;
  config?: {
    url?: string;
    method?: string;
    can_interrupt?: boolean;
    response?: { ignore?: boolean; parse?: boolean };
    [key: string]: unknown;
  };
}

function hooksAt(config: unknown, path: (string | number)[]): RawHook[] {
  return getPath<RawHook[]>(config, path, []);
}

export function hookContainerPath(
  flow: string,
  timing: string,
  method?: string,
): (string | number)[] {
  const base = ["selfservice", "flows", flow, timing];
  return method ? [...base, method, "hooks"] : [...base, "hooks"];
}

/** All web_hook entries across flows, timings and method containers. */
export function listWebHooks(config: unknown): WebHookEntry[] {
  const entries: WebHookEntry[] = [];
  for (const flow of HOOK_FLOWS) {
    for (const timing of HOOK_TIMINGS) {
      const containers: (string | undefined)[] = [
        undefined,
        ...HOOK_METHODS.filter((m) => m !== "all"),
      ];
      for (const method of containers) {
        const hooks = hooksAt(config, hookContainerPath(flow, timing, method));
        hooks.forEach((hook, index) => {
          if (hook?.hook !== "web_hook") return;
          entries.push({
            flow,
            timing,
            method,
            index,
            url: hook.config?.url ?? "",
            httpMethod: hook.config?.method ?? "POST",
            canInterrupt: hook.config?.can_interrupt ?? false,
          });
        });
      }
    }
  }
  return entries;
}

export interface HookAuth {
  type: (typeof HOOK_AUTH_TYPES)[number];
  /** basic */
  user?: string;
  password?: string;
  /** key */
  name?: string;
  value?: string;
  in?: "header" | "cookie";
}

export interface NewWebHookInput {
  flow: string;
  timing: string;
  /** "all" = flow-level */
  method: string;
  url: string;
  httpMethod: string;
  /** Process response: webhook may modify identity / interrupt the flow. */
  canInterrupt?: boolean;
  /** Async: response is ignored, never blocks or interrupts the flow. */
  async?: boolean;
  /** Jsonnet request-body template (raw source; encoded to base64:// on save). */
  body?: string;
  auth?: HookAuth;
}

function encodeBody(jsonnet: string): string {
  return `base64://${Buffer.from(jsonnet, "utf8").toString("base64")}`;
}

function buildAuth(auth: HookAuth | undefined): Record<string, unknown> | null {
  if (!auth || auth.type === "none") return null;
  if (auth.type === "basic") {
    if (!auth.user) throw new Error("Basic auth requires a username");
    return {
      type: "basic_auth",
      config: { user: auth.user, password: auth.password ?? "" },
    };
  }
  // key
  if (!auth.name || !auth.value) {
    throw new Error("API key auth requires a name and value");
  }
  return {
    type: "api_key",
    config: { name: auth.name, value: auth.value, in: auth.in ?? "header" },
  };
}

/** Validate + append a web_hook; returns the container path and new array. */
export function addWebHook(
  config: unknown,
  input: NewWebHookInput,
): { path: (string | number)[]; value: unknown[] } {
  if (!(HOOK_FLOWS as readonly string[]).includes(input.flow)) {
    throw new Error(`Unknown flow: ${input.flow}`);
  }
  if (!(HOOK_TIMINGS as readonly string[]).includes(input.timing)) {
    throw new Error(`Unknown timing: ${input.timing}`);
  }
  if (!(HOOK_METHODS as readonly string[]).includes(input.method)) {
    throw new Error(`Unknown method: ${input.method}`);
  }
  if (input.timing === "before" && input.method !== "all") {
    throw new Error("Before-hooks are flow-level; choose method 'all'");
  }
  if (!/^https?:\/\/.+/.test(input.url)) {
    throw new Error("Webhook URL must start with http:// or https://");
  }
  if (!(HOOK_HTTP_METHODS as readonly string[]).includes(input.httpMethod)) {
    throw new Error(`Unknown HTTP method: ${input.httpMethod}`);
  }
  if (input.async && input.canInterrupt) {
    throw new Error(
      "An asynchronous action cannot also process the response / interrupt the flow",
    );
  }

  const auth = buildAuth(input.auth);
  const hookConfig: Record<string, unknown> = {
    url: input.url,
    method: input.httpMethod,
  };
  if (input.body && input.body.trim()) {
    hookConfig.body = encodeBody(input.body);
  }
  if (input.async) {
    hookConfig.response = { ignore: true };
  } else if (input.canInterrupt) {
    hookConfig.can_interrupt = true;
    hookConfig.response = { parse: true };
  }
  if (auth) hookConfig.auth = auth;

  const method = input.method === "all" ? undefined : input.method;
  const path = hookContainerPath(input.flow, input.timing, method);
  const existing = hooksAt(config, path);
  const entry: RawHook = { hook: "web_hook", config: hookConfig };
  return { path, value: [...existing, entry] };
}

/** Remove the hook at index in the given container; returns path + new array. */
export function removeWebHook(
  config: unknown,
  flow: string,
  timing: string,
  method: string | undefined,
  index: number,
): { path: (string | number)[]; value: unknown[] } {
  const path = hookContainerPath(flow, timing, method);
  const existing = hooksAt(config, path);
  if (index < 0 || index >= existing.length) {
    throw new Error("Hook not found (it may have been removed already)");
  }
  return { path, value: existing.filter((_, i) => i !== index) };
}
