import { describe, expect, it } from "vitest";
import { formatHeaderMap, parseHeaderMap } from "@/lib/header-map";

describe("parseHeaderMap", () => {
  it("parses Key: Value lines into a map", () => {
    expect(parseHeaderMap("X-A: 1\nX-B: two words")).toEqual({
      "X-A": "1",
      "X-B": "two words",
    });
  });

  it("trims, ignores blank lines and lines without a colon", () => {
    expect(parseHeaderMap("  X-A : v  \n\nnocolon\nX-B:")).toEqual({
      "X-A": "v",
      "X-B": "",
    });
  });

  it("keeps only the first colon as the separator (values may contain colons)", () => {
    expect(parseHeaderMap("X-URL: https://x.test/a:b")).toEqual({
      "X-URL": "https://x.test/a:b",
    });
  });

  it("returns an empty map for empty input", () => {
    expect(parseHeaderMap("")).toEqual({});
    expect(parseHeaderMap("   \n  ")).toEqual({});
  });
});

describe("formatHeaderMap", () => {
  it("formats a map back to Key: Value lines", () => {
    expect(formatHeaderMap({ "X-A": "1", "X-B": "2" })).toBe("X-A: 1\nX-B: 2");
  });

  it("handles empty / non-object input", () => {
    expect(formatHeaderMap({})).toBe("");
    expect(formatHeaderMap(undefined)).toBe("");
    expect(formatHeaderMap(null)).toBe("");
  });

  it("round-trips with parseHeaderMap", () => {
    const text = "X-A: 1\nX-B: two";
    expect(formatHeaderMap(parseHeaderMap(text))).toBe(text);
  });
});
