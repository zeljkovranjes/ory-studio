import { describe, expect, it } from "vitest";
import { buildTraits } from "@/lib/identity-traits";

describe("buildTraits", () => {
  it("builds traits from simple fields", () => {
    expect(
      buildTraits({ email: "a@b.co", first: "Ada", last: "Lovelace" }),
    ).toEqual({
      email: "a@b.co",
      name: { first: "Ada", last: "Lovelace" },
    });
  });

  it("omits name when not provided", () => {
    expect(buildTraits({ email: "a@b.co" })).toEqual({ email: "a@b.co" });
  });

  it("rejects invalid email", () => {
    expect(() => buildTraits({ email: "not-an-email" })).toThrow(/valid email/);
  });

  it("prefers raw traits JSON when provided", () => {
    expect(
      buildTraits({ email: "", rawTraits: '{"username": "ada"}' }),
    ).toEqual({ username: "ada" });
  });

  it("rejects malformed or non-object raw traits", () => {
    expect(() => buildTraits({ email: "", rawTraits: "{oops" })).toThrow(
      /valid JSON/,
    );
    expect(() => buildTraits({ email: "", rawTraits: "[1,2]" })).toThrow(
      /JSON object/,
    );
  });
});
