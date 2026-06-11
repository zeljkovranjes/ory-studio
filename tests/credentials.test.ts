import { describe, expect, it } from "vitest";
import { credentialLabel, summarizeCredentials } from "@/lib/credentials";

describe("credentialLabel", () => {
  it("maps known credential types to human labels", () => {
    expect(credentialLabel("password")).toBe("Password");
    expect(credentialLabel("oidc")).toBe("Social sign-in");
    expect(credentialLabel("totp")).toBe("Authenticator app (TOTP)");
    expect(credentialLabel("webauthn")).toBe("Passkey / WebAuthn");
    expect(credentialLabel("lookup_secret")).toBe("Backup recovery codes");
    expect(credentialLabel("code")).toBe("One-time code (email / SMS)");
  });

  it("falls back to the raw type for unknown methods", () => {
    expect(credentialLabel("future_method")).toBe("future_method");
  });
});

describe("summarizeCredentials", () => {
  it("returns an empty list when there are no credentials", () => {
    expect(summarizeCredentials({})).toEqual([]);
    expect(summarizeCredentials({ credentials: undefined })).toEqual([]);
  });

  it("flattens the credentials map, sorted by label, with identifiers and dates", () => {
    const result = summarizeCredentials({
      credentials: {
        password: {
          type: "password",
          identifiers: ["jane@example.com"],
          created_at: "2026-01-02T00:00:00Z",
        },
        code: {
          type: "code",
          identifiers: ["jane@example.com"],
          created_at: "2026-01-03T00:00:00Z",
        },
      },
    });
    // sorted: "One-time code…" < "Password"
    expect(result.map((c) => c.type)).toEqual(["code", "password"]);
    expect(result[1]).toEqual({
      type: "password",
      label: "Password",
      identifiers: ["jane@example.com"],
      createdAt: "2026-01-02T00:00:00Z",
    });
  });

  it("never exposes secret config and tolerates missing identifiers", () => {
    const result = summarizeCredentials({
      credentials: { totp: { type: "totp" } },
    });
    expect(result).toEqual([
      {
        type: "totp",
        label: "Authenticator app (TOTP)",
        identifiers: [],
        createdAt: undefined,
      },
    ]);
    // ensure no config/secret leaks into the summary shape
    expect(Object.keys(result[0])).toEqual([
      "type",
      "label",
      "identifiers",
      "createdAt",
    ]);
  });
});
