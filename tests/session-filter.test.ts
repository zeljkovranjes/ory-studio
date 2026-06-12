import { describe, expect, it } from "vitest";
import { parseActiveFilter } from "@/lib/session-filter";

describe("parseActiveFilter", () => {
  it("maps the active/inactive selections to booleans", () => {
    expect(parseActiveFilter("active")).toBe(true);
    expect(parseActiveFilter("inactive")).toBe(false);
  });

  it("returns undefined for 'all', missing, or unknown values", () => {
    expect(parseActiveFilter("all")).toBeUndefined();
    expect(parseActiveFilter(undefined)).toBeUndefined();
    expect(parseActiveFilter("")).toBeUndefined();
    expect(parseActiveFilter("true")).toBeUndefined();
    expect(parseActiveFilter("1 OR 1=1")).toBeUndefined();
  });
});
