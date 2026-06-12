import { describe, expect, it } from "vitest";
import { isApiKeyExpired } from "@/lib/api-keys";

const now = Date.parse("2026-06-11T12:00:00.000Z");

describe("isApiKeyExpired", () => {
  it("treats a null expiry as never-expiring", () => {
    expect(isApiKeyExpired({ expires_at: null }, now)).toBe(false);
  });

  it("is expired when expiry is in the past", () => {
    expect(
      isApiKeyExpired({ expires_at: "2026-06-11T11:59:59.000Z" }, now),
    ).toBe(true);
    expect(
      isApiKeyExpired({ expires_at: "2020-01-01T00:00:00.000Z" }, now),
    ).toBe(true);
  });

  it("is not expired when expiry is in the future", () => {
    expect(
      isApiKeyExpired({ expires_at: "2026-06-11T12:00:01.000Z" }, now),
    ).toBe(false);
    expect(
      isApiKeyExpired({ expires_at: "2027-01-01T00:00:00.000Z" }, now),
    ).toBe(false);
  });

  it("treats an exact-now expiry as expired (<=)", () => {
    expect(
      isApiKeyExpired({ expires_at: "2026-06-11T12:00:00.000Z" }, now),
    ).toBe(true);
  });

  it("treats an unparseable expiry as not expired", () => {
    expect(isApiKeyExpired({ expires_at: "not-a-date" }, now)).toBe(false);
  });
});
