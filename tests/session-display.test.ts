import { describe, expect, it } from "vitest";
import { aalLabel } from "@/lib/session-display";

describe("aalLabel", () => {
  it("labels known assurance levels", () => {
    expect(aalLabel("aal1")).toMatch(/AAL1/);
    expect(aalLabel("aal1")).toMatch(/single-factor/);
    expect(aalLabel("aal2")).toMatch(/two-factor/);
    expect(aalLabel("aal3")).toMatch(/hardware/);
    expect(aalLabel("aal0")).toMatch(/no credential/);
  });

  it("falls back to the raw value or 'unknown'", () => {
    expect(aalLabel("aal9")).toBe("aal9");
    expect(aalLabel(undefined)).toBe("unknown");
    expect(aalLabel("")).toBe("unknown");
  });
});
