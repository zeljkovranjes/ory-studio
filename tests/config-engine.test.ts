import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
  applyKratosAuthPatch,
  applyYamlPatches,
  isValidDuration,
} from "@/lib/config-engine";

const SAMPLE = `# Kratos configuration — owned by the ory-studio config engine.
version: v1.3.1

selfservice:
  methods:
    password:
      enabled: true
    code:
      enabled: true
    totp:
      enabled: true

  flows:
    settings:
      privileged_session_max_age: 15m

    recovery:
      enabled: true

    verification:
      enabled: true

    registration:
      enabled: true

session:
  lifespan: 72h
  cookie:
    persistent: true
    same_site: Lax
`;

describe("applyKratosAuthPatch", () => {
  it("flips toggles and updates durations", () => {
    const out = applyKratosAuthPatch(SAMPLE, {
      passwordEnabled: false,
      registrationEnabled: false,
      sessionLifespan: "24h",
      cookieSameSite: "Strict",
    });
    const config = parse(out);
    expect(config.selfservice.methods.password.enabled).toBe(false);
    expect(config.selfservice.flows.registration.enabled).toBe(false);
    expect(config.session.lifespan).toBe("24h");
    expect(config.session.cookie.same_site).toBe("Strict");
    // untouched values survive
    expect(config.selfservice.methods.totp.enabled).toBe(true);
  });

  it("preserves comments", () => {
    const out = applyKratosAuthPatch(SAMPLE, { codeEnabled: false });
    expect(out).toContain("owned by the ory-studio config engine");
  });

  it("creates missing paths", () => {
    const out = applyKratosAuthPatch("version: v1.3.1\n", {
      recoveryEnabled: true,
    });
    const config = parse(out);
    expect(config.selfservice.flows.recovery.enabled).toBe(true);
  });

  it("rejects invalid durations", () => {
    expect(() =>
      applyKratosAuthPatch(SAMPLE, { sessionLifespan: "3 days" }),
    ).toThrow(/Invalid duration/);
  });

  it("rejects invalid SameSite values", () => {
    expect(() =>
      applyKratosAuthPatch(SAMPLE, {
        cookieSameSite: "Sneaky" as unknown as "Lax",
      }),
    ).toThrow(/SameSite/);
  });
});

describe("applyYamlPatches", () => {
  it("applies arbitrary path patches", () => {
    const out = applyYamlPatches(SAMPLE, [
      {
        path: ["selfservice", "methods", "passkey", "enabled"],
        value: true,
      },
      {
        path: ["session", "whoami", "required_aal"],
        value: "highest_available",
      },
    ]);
    const config = parse(out);
    expect(config.selfservice.methods.passkey.enabled).toBe(true);
    expect(config.session.whoami.required_aal).toBe("highest_available");
  });

  it("skips undefined values and writes arrays/objects", () => {
    const out = applyYamlPatches(SAMPLE, [
      { path: ["session", "lifespan"], value: undefined },
      {
        path: ["courier", "channels"],
        value: [{ id: "sms", type: "http" }],
      },
    ]);
    const config = parse(out);
    expect(config.session.lifespan).toBe("72h");
    expect(config.courier.channels).toEqual([{ id: "sms", type: "http" }]);
  });

  it("preserves comments", () => {
    const out = applyYamlPatches(SAMPLE, [
      { path: ["session", "lifespan"], value: "12h" },
    ]);
    expect(out).toContain("owned by the ory-studio config engine");
  });
});

describe("isValidDuration", () => {
  it("accepts kratos-style durations", () => {
    for (const value of ["72h", "15m", "1h30m", "1h1m10s", "10s"]) {
      expect(isValidDuration(value)).toBe(true);
    }
  });
  it("rejects malformed values", () => {
    for (const value of ["", "3 days", "h", "10", "1d", "10s5m"]) {
      expect(isValidDuration(value)).toBe(false);
    }
  });
});
