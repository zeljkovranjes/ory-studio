import { describe, expect, it } from "vitest";
import { splitScopes } from "@/lib/hydra";

describe("splitScopes", () => {
  it("splits a space-delimited scope string into a list", () => {
    expect(splitScopes("openid offline_access email")).toEqual([
      "openid",
      "offline_access",
      "email",
    ]);
  });

  it("collapses extra whitespace and trims", () => {
    expect(splitScopes("  openid   email  ")).toEqual(["openid", "email"]);
    expect(splitScopes("openid\tprofile\nemail")).toEqual([
      "openid",
      "profile",
      "email",
    ]);
  });

  it("returns an empty list for empty or undefined scope", () => {
    expect(splitScopes("")).toEqual([]);
    expect(splitScopes(undefined)).toEqual([]);
    expect(splitScopes("   ")).toEqual([]);
  });
});
