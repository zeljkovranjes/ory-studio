import { describe, expect, it } from "vitest";
import {
  PROVIDER_CATALOG,
  listProviders,
  providerLabel,
  removeProvider,
  upsertProvider,
} from "@/lib/kratos-social";

function configWith(providers: unknown[]) {
  return {
    selfservice: { methods: { oidc: { config: { providers } } } },
  };
}

const base = {
  id: "google",
  provider: "google",
  clientId: "cid",
  clientSecret: "secret",
};

describe("PROVIDER_CATALOG", () => {
  it("declares provider-specific fields", () => {
    expect(providerLabel("microsoft")).toBe("Microsoft");
    const ms = PROVIDER_CATALOG.find((p) => p.type === "microsoft")!;
    expect(ms.fields).toContain("microsoft_tenant");
    const generic = PROVIDER_CATALOG.find((p) => p.type === "generic")!;
    expect(generic.issuerRequired).toBe(true);
  });
});

describe("upsertProvider (add)", () => {
  it("adds a new provider with label and scopes", () => {
    const out = upsertProvider(configWith([]), {
      ...base,
      label: "Google",
      scope: "email profile",
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: "google",
      provider: "google",
      client_id: "cid",
      client_secret: "secret",
      label: "Google",
      scope: ["email", "profile"],
    });
    expect(out[0].mapper_url).toMatch(/^base64:\/\//);
  });

  it("rejects a duplicate id, bad id, unknown provider, missing client id", () => {
    const cfg = configWith([{ id: "google", provider: "google", client_id: "x" }]);
    expect(() => upsertProvider(cfg, base)).toThrow(/already exists/);
    expect(() => upsertProvider(configWith([]), { ...base, id: "bad id" })).toThrow(
      /Provider ID/,
    );
    expect(() =>
      upsertProvider(configWith([]), { ...base, provider: "nope" }),
    ).toThrow(/Unknown provider/);
    expect(() =>
      upsertProvider(configWith([]), { ...base, clientId: "" }),
    ).toThrow(/Client ID/);
  });

  it("requires an https issuer URL for generic providers", () => {
    expect(() =>
      upsertProvider(configWith([]), {
        ...base,
        id: "acme",
        provider: "generic",
        issuerUrl: "",
      }),
    ).toThrow(/issuer URL/);
    const ok = upsertProvider(configWith([]), {
      ...base,
      id: "acme",
      provider: "generic",
      issuerUrl: "https://id.acme.test",
    });
    expect(ok[0].issuer_url).toBe("https://id.acme.test");
  });
});

describe("upsertProvider (edit)", () => {
  const existing = configWith([
    {
      id: "google",
      provider: "google",
      client_id: "old",
      client_secret: "kept-secret",
      mapper_url: "base64://existing",
      label: "Google",
    },
  ]);

  it("replaces the matching provider and preserves the mapper", () => {
    const out = upsertProvider(
      existing,
      { ...base, clientId: "new", clientSecret: "rotated", label: "Google SSO" },
      { isEdit: true },
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      client_id: "new",
      client_secret: "rotated",
      label: "Google SSO",
      mapper_url: "base64://existing",
    });
  });

  it("keeps the existing secret when the new secret is blank", () => {
    const out = upsertProvider(
      existing,
      { ...base, clientSecret: "" },
      { isEdit: true },
    );
    expect(out[0].client_secret).toBe("kept-secret");
  });
});

describe("removeProvider / listProviders", () => {
  it("removes by id and lists", () => {
    const cfg = configWith([
      { id: "a", provider: "google", client_id: "1" },
      { id: "b", provider: "github", client_id: "2" },
    ]);
    expect(listProviders(cfg)).toHaveLength(2);
    expect(removeProvider(cfg, "a").map((p) => p.id)).toEqual(["b"]);
  });
});
