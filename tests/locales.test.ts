import { describe, expect, it } from "vitest";
import { isValidLocale, parseMessages } from "@/lib/locales";

describe("parseMessages", () => {
  it("accepts a flat string→string object", () => {
    expect(parseMessages('{"login.title":"Hola","ok":"OK"}')).toEqual({
      "login.title": "Hola",
      ok: "OK",
    });
  });
  it("rejects invalid JSON, arrays, and non-string values", () => {
    expect(() => parseMessages("{oops")).toThrow(/valid JSON/);
    expect(() => parseMessages("[1,2]")).toThrow(/JSON object/);
    expect(() => parseMessages('{"a": 1}')).toThrow(/must be a string/);
  });
});

describe("isValidLocale", () => {
  it("accepts BCP-47-ish codes", () => {
    for (const l of ["en", "es", "pt-BR", "zh-Hans"]) {
      expect(isValidLocale(l)).toBe(true);
    }
  });
  it("rejects malformed codes", () => {
    for (const l of ["", "english", "E", "en_US", "123"]) {
      expect(isValidLocale(l)).toBe(false);
    }
  });
});
