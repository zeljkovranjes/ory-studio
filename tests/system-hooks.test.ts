import { describe, expect, it } from "vitest";
import {
  buildSystemHookPatches,
  systemHooksInstalled,
} from "@/lib/system-hooks";

const BASE = "http://studio:3000";
const TOKEN = "test-token";

const EMPTY_CONFIG = { selfservice: { flows: {} } };

describe("buildSystemHookPatches", () => {
  it("adds a collector hook for every flow", () => {
    const patches = buildSystemHookPatches(EMPTY_CONFIG, BASE, TOKEN);
    expect(patches).toHaveLength(5);
    const registration = patches.find((patch) =>
      patch.path.includes("registration"),
    );
    const hooks = registration!.value as {
      hook: string;
      config: {
        url: string;
        response: { ignore: boolean };
        auth: { config: { value: string } };
      };
    }[];
    expect(hooks).toHaveLength(1);
    expect(hooks[0].hook).toBe("web_hook");
    expect(hooks[0].config.url).toBe(
      "http://studio:3000/api/internal/events/signup",
    );
    expect(hooks[0].config.response.ignore).toBe(true);
    expect(hooks[0].config.auth.config.value).toBe(TOKEN);
  });

  it("preserves existing hooks and is idempotent", () => {
    const config = {
      selfservice: {
        flows: {
          registration: {
            after: {
              hooks: [
                { hook: "session" },
                {
                  hook: "web_hook",
                  config: {
                    url: "http://studio:3000/api/internal/events/signup",
                  },
                },
              ],
            },
          },
        },
      },
    };
    const patches = buildSystemHookPatches(config, BASE, TOKEN);
    // registration already wired — only the other four flows get patches
    expect(patches).toHaveLength(4);
    expect(
      patches.some((patch) => patch.path.includes("registration")),
    ).toBe(false);
  });

  it("also injects into method-specific blocks so overrides don't suppress it", () => {
    // registration.after.password.hooks holds the session hook; Kratos ignores
    // the global after.hooks for the password method, so the collector hook must
    // land in the password block too (this was the signup-not-tracked bug).
    const config = {
      selfservice: {
        flows: {
          registration: {
            after: { password: { hooks: [{ hook: "session" }] } },
          },
        },
      },
    };
    const regPatches = buildSystemHookPatches(config, BASE, TOKEN).filter((p) =>
      p.path.includes("registration"),
    );
    const paths = regPatches.map((p) => p.path.join("."));
    expect(paths).toContain("selfservice.flows.registration.after.hooks");
    expect(paths).toContain(
      "selfservice.flows.registration.after.password.hooks",
    );
    const pw = regPatches.find((p) => p.path.includes("password"))!;
    const hooks = pw.value as { hook: string }[];
    expect(hooks.map((h) => h.hook)).toEqual(["session", "web_hook"]);
  });

  it("keeps user hooks when appending", () => {
    const config = {
      selfservice: {
        flows: {
          login: {
            after: {
              hooks: [
                {
                  hook: "web_hook",
                  config: { url: "https://api.example.com/audit" },
                },
              ],
            },
          },
        },
      },
    };
    const patches = buildSystemHookPatches(config, BASE, TOKEN);
    const login = patches.find((patch) => patch.path.includes("login"));
    expect((login!.value as unknown[]).length).toBe(2);
  });
});

describe("systemHooksInstalled", () => {
  it("is false for a fresh config and true after applying patches", () => {
    expect(systemHooksInstalled(EMPTY_CONFIG, BASE)).toBe(false);

    const installed = {
      selfservice: {
        flows: Object.fromEntries(
          [
            ["registration", "signup"],
            ["login", "login"],
            ["recovery", "recovery"],
            ["verification", "verification"],
            ["settings", "settings_updated"],
          ].map(([flow, event]) => [
            flow,
            {
              after: {
                hooks: [
                  {
                    hook: "web_hook",
                    config: {
                      url: `http://studio:3000/api/internal/events/${event}`,
                    },
                  },
                ],
              },
            },
          ]),
        ),
      },
    };
    expect(systemHooksInstalled(installed, BASE)).toBe(true);
  });
});
