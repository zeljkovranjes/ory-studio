import { describe, expect, it } from "vitest";
import { parseAddressIndex } from "@/lib/verifiable-address";

describe("parseAddressIndex", () => {
  it("accepts in-range non-negative integers", () => {
    expect(parseAddressIndex("0", 2)).toBe(0);
    expect(parseAddressIndex("1", 2)).toBe(1);
    expect(parseAddressIndex(" 1 ", 2)).toBe(1);
  });

  it("rejects out-of-range indices", () => {
    expect(() => parseAddressIndex("2", 2)).toThrow(/out of range/);
    expect(() => parseAddressIndex("0", 0)).toThrow(/out of range/);
  });

  it("rejects negative, fractional and non-numeric input", () => {
    expect(() => parseAddressIndex("-1", 2)).toThrow(/Invalid/);
    expect(() => parseAddressIndex("1.5", 2)).toThrow(/Invalid/);
    expect(() => parseAddressIndex("abc", 2)).toThrow(/Invalid/);
    expect(() => parseAddressIndex("", 2)).toThrow(/Invalid/);
  });

  it("rejects path-injection attempts in the index", () => {
    // would otherwise smuggle extra JSON Patch path segments
    expect(() => parseAddressIndex("0/verified/../state", 2)).toThrow(/Invalid/);
    expect(() => parseAddressIndex("1e1", 2)).toThrow(/Invalid/);
    expect(() => parseAddressIndex("0x1", 2)).toThrow(/Invalid/);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(parseAddressIndex(" 0 ", 2)).toBe(0);
  });
});
