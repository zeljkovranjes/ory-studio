import { describe, expect, it } from "vitest";
import { parseJsonValue } from "@/lib/json-value";

describe("parseJsonValue", () => {
  it("returns null for empty or whitespace input (clear metadata)", () => {
    expect(parseJsonValue("")).toBeNull();
    expect(parseJsonValue("   \n\t")).toBeNull();
  });

  it("parses objects, arrays and scalars (freeform metadata)", () => {
    expect(parseJsonValue('{"tier":"gold","n":2}')).toEqual({
      tier: "gold",
      n: 2,
    });
    expect(parseJsonValue("[1,2,3]")).toEqual([1, 2, 3]);
    expect(parseJsonValue('"hello"')).toBe("hello");
    expect(parseJsonValue("42")).toBe(42);
    expect(parseJsonValue("true")).toBe(true);
    expect(parseJsonValue("null")).toBeNull();
  });

  it("throws on malformed JSON", () => {
    expect(() => parseJsonValue("{nope")).toThrow(/valid JSON/);
    expect(() => parseJsonValue("{'single':1}")).toThrow(/valid JSON/);
  });
});
