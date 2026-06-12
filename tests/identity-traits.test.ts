import { describe, expect, it } from "vitest";
import { buildTraits, parseTraitsObject } from "@/lib/identity-traits";
import { buildCreateIdentityBody } from "@/lib/kratos";

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

describe("buildCreateIdentityBody", () => {
  const traits = { email: "a@b.co" };

  it("builds a body with schema_id and traits, no credentials by default", () => {
    const body = buildCreateIdentityBody({ schemaId: "default", traits });
    expect(body).toEqual({ schema_id: "default", traits });
    expect(body).not.toHaveProperty("credentials");
  });

  it("includes a password credential only when a password is given", () => {
    const body = buildCreateIdentityBody({
      schemaId: "default",
      traits,
      password: "s3cr3t-Passw0rd!",
    });
    expect(body.credentials).toEqual({
      password: { config: { password: "s3cr3t-Passw0rd!" } },
    });
  });

  it("omits credentials for an empty password string", () => {
    const body = buildCreateIdentityBody({
      schemaId: "default",
      traits,
      password: "",
    });
    expect(body).not.toHaveProperty("credentials");
  });
});

describe("parseTraitsObject", () => {
  it("parses a JSON object", () => {
    expect(parseTraitsObject('{"email":"a@b.co","name":{"first":"Ada"}}')).toEqual(
      { email: "a@b.co", name: { first: "Ada" } },
    );
  });

  it("rejects malformed JSON", () => {
    expect(() => parseTraitsObject("{nope")).toThrow(/valid JSON/);
  });

  it("rejects non-object JSON (array, null, scalar)", () => {
    expect(() => parseTraitsObject("[1,2]")).toThrow(/JSON object/);
    expect(() => parseTraitsObject("null")).toThrow(/JSON object/);
    expect(() => parseTraitsObject('"hi"')).toThrow(/JSON object/);
    expect(() => parseTraitsObject("42")).toThrow(/JSON object/);
  });
});
