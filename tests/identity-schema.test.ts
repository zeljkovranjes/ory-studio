import { describe, expect, it } from "vitest";
import { summarizeSchemaTraits } from "@/lib/identity-schema";

// A realistic Kratos identity schema (email as login identifier + recovery +
// verification, a nested name object, and a non-special phone field).
const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    traits: {
      type: "object",
      required: ["email"],
      properties: {
        email: {
          type: "string",
          format: "email",
          title: "E-Mail",
          "ory.sh/kratos": {
            credentials: {
              password: { identifier: true },
              webauthn: { identifier: true },
              code: { identifier: true, via: "email" },
            },
            recovery: { via: "email" },
            verification: { via: "email" },
          },
        },
        name: {
          type: "object",
          properties: { first: { type: "string" }, last: { type: "string" } },
        },
        phone: { type: "string" },
      },
    },
  },
};

describe("summarizeSchemaTraits", () => {
  it("extracts top-level trait fields with type and required flag", () => {
    const fields = summarizeSchemaTraits(schema);
    expect(fields.map((f) => f.name)).toEqual(["email", "name", "phone"]);
    const email = fields.find((f) => f.name === "email")!;
    expect(email.type).toBe("string");
    expect(email.title).toBe("E-Mail");
    expect(email.required).toBe(true);
    expect(fields.find((f) => f.name === "name")!.type).toBe("object");
    expect(fields.find((f) => f.name === "phone")!.required).toBe(false);
  });

  it("detects login / recovery / verification roles from the kratos extension", () => {
    const fields = summarizeSchemaTraits(schema);
    const email = fields.find((f) => f.name === "email")!;
    expect(email.identifier).toBe(true);
    expect(email.recovery).toBe(true);
    expect(email.verification).toBe(true);

    const phone = fields.find((f) => f.name === "phone")!;
    expect(phone.identifier).toBe(false);
    expect(phone.recovery).toBe(false);
    expect(phone.verification).toBe(false);
  });

  it("returns an empty list for malformed or non-schema input", () => {
    expect(summarizeSchemaTraits(null)).toEqual([]);
    expect(summarizeSchemaTraits({})).toEqual([]);
    expect(summarizeSchemaTraits({ properties: { traits: {} } })).toEqual([]);
    expect(summarizeSchemaTraits("not a schema")).toEqual([]);
  });
});
