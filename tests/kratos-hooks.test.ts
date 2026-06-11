import { describe, expect, it } from "vitest";
import {
  addWebHook,
  listWebHooks,
  removeWebHook,
} from "@/lib/kratos-hooks";
import { addProvider, removeProvider } from "@/lib/kratos-social";

const CONFIG = {
  selfservice: {
    flows: {
      registration: {
        enabled: true,
        after: {
          password: {
            hooks: [
              { hook: "session" },
              {
                hook: "web_hook",
                config: {
                  url: "https://api.example.com/billing/link",
                  method: "POST",
                },
              },
            ],
          },
        },
      },
      login: {
        after: {
          hooks: [
            {
              hook: "web_hook",
              config: {
                url: "https://api.example.com/audit",
                method: "POST",
                can_interrupt: true,
              },
            },
          ],
        },
      },
    },
    methods: {
      oidc: {
        enabled: true,
        config: {
          providers: [
            {
              id: "google",
              provider: "google",
              client_id: "abc",
              mapper_url: "base64://e30=",
            },
          ],
        },
      },
    },
  },
};

describe("listWebHooks", () => {
  it("finds method-scoped and flow-level web hooks, skipping built-ins", () => {
    const hooks = listWebHooks(CONFIG);
    expect(hooks).toHaveLength(2);
    const registration = hooks.find((h) => h.flow === "registration");
    expect(registration).toMatchObject({
      timing: "after",
      method: "password",
      index: 1,
      url: "https://api.example.com/billing/link",
    });
    const login = hooks.find((h) => h.flow === "login");
    expect(login).toMatchObject({
      method: undefined,
      canInterrupt: true,
    });
  });
});

describe("addWebHook", () => {
  it("appends to an existing container", () => {
    const { path, value } = addWebHook(CONFIG, {
      flow: "registration",
      timing: "after",
      method: "password",
      url: "https://api.example.com/welcome",
      httpMethod: "POST",
      canInterrupt: false,
    });
    expect(path).toEqual([
      "selfservice",
      "flows",
      "registration",
      "after",
      "password",
      "hooks",
    ]);
    expect(value).toHaveLength(3);
  });

  it("creates flow-level hooks for method 'all'", () => {
    const { path, value } = addWebHook(CONFIG, {
      flow: "recovery",
      timing: "after",
      method: "all",
      url: "https://api.example.com/recovered",
      httpMethod: "POST",
      canInterrupt: true,
    });
    expect(path).toEqual([
      "selfservice",
      "flows",
      "recovery",
      "after",
      "hooks",
    ]);
    expect(value).toHaveLength(1);
  });

  it("rejects bad input", () => {
    const base = {
      flow: "registration",
      timing: "after",
      method: "all",
      url: "https://ok.example.com",
      httpMethod: "POST",
      canInterrupt: false,
    };
    expect(() => addWebHook(CONFIG, { ...base, flow: "nope" })).toThrow();
    expect(() => addWebHook(CONFIG, { ...base, url: "ftp://x" })).toThrow();
    expect(() =>
      addWebHook(CONFIG, { ...base, timing: "before", method: "password" }),
    ).toThrow(/flow-level/);
  });

  it("encodes body, async, process-response and auth", () => {
    const { value } = addWebHook(CONFIG, {
      flow: "login",
      timing: "after",
      method: "all",
      url: "https://api.example.com/hook",
      httpMethod: "POST",
      canInterrupt: true,
      body: "function(ctx) { id: ctx.identity.id }",
      auth: { type: "key", name: "Authorization", value: "secret", in: "header" },
    });
    const hook = (value as { config: Record<string, unknown> }[]).at(-1)!;
    expect((hook.config.body as string).startsWith("base64://")).toBe(true);
    expect(hook.config.can_interrupt).toBe(true);
    expect((hook.config.response as { parse: boolean }).parse).toBe(true);
    expect((hook.config.auth as { type: string }).type).toBe("api_key");
  });

  it("async hooks ignore the response and cannot also interrupt", () => {
    const { value } = addWebHook(CONFIG, {
      flow: "login",
      timing: "after",
      method: "all",
      url: "https://api.example.com/async",
      httpMethod: "POST",
      async: true,
    });
    const hook = (value as { config: Record<string, unknown> }[]).at(-1)!;
    expect((hook.config.response as { ignore: boolean }).ignore).toBe(true);

    expect(() =>
      addWebHook(CONFIG, {
        flow: "login",
        timing: "after",
        method: "all",
        url: "https://api.example.com/x",
        httpMethod: "POST",
        async: true,
        canInterrupt: true,
      }),
    ).toThrow(/cannot also/);
  });

  it("validates basic and key auth fields", () => {
    const base = {
      flow: "login",
      timing: "after",
      method: "all",
      url: "https://ok.example.com",
      httpMethod: "POST",
    };
    expect(() =>
      addWebHook(CONFIG, { ...base, auth: { type: "basic" } }),
    ).toThrow(/username/);
    expect(() =>
      addWebHook(CONFIG, { ...base, auth: { type: "key", name: "X" } }),
    ).toThrow(/name and value/);
  });
});

describe("removeWebHook", () => {
  it("removes by container + index", () => {
    const { value } = removeWebHook(
      CONFIG,
      "registration",
      "after",
      "password",
      1,
    );
    expect(value).toEqual([{ hook: "session" }]);
  });

  it("throws for unknown index", () => {
    expect(() =>
      removeWebHook(CONFIG, "registration", "after", "password", 9),
    ).toThrow(/not found/);
  });
});

describe("social providers", () => {
  it("adds a provider with defaults", () => {
    const providers = addProvider(CONFIG, {
      id: "github",
      provider: "github",
      clientId: "client",
      clientSecret: "secret",
      scope: "email, profile",
    });
    expect(providers).toHaveLength(2);
    expect(providers[1]).toMatchObject({
      id: "github",
      scope: ["email", "profile"],
    });
    expect(providers[1].mapper_url.startsWith("base64://")).toBe(true);
  });

  it("rejects duplicates, bad ids and generic without issuer", () => {
    const base = {
      id: "x",
      provider: "github",
      clientId: "client",
      clientSecret: "",
    };
    expect(() => addProvider(CONFIG, { ...base, id: "google" })).toThrow(
      /already exists/,
    );
    expect(() => addProvider(CONFIG, { ...base, id: "bad id!" })).toThrow();
    expect(() =>
      addProvider(CONFIG, { ...base, provider: "generic" }),
    ).toThrow(/issuer/);
  });

  it("removes a provider by id", () => {
    expect(removeProvider(CONFIG, "google")).toEqual([]);
    expect(removeProvider(CONFIG, "missing")).toHaveLength(1);
  });
});
