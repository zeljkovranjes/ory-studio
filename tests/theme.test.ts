import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, themeToCss, validateThemeTokens } from "@/lib/theme";

describe("themeToCss", () => {
  it("emits --ory-theme-* variables for the default palette", () => {
    const css = themeToCss(DEFAULT_THEME);
    expect(css).toContain(":root {");
    expect(css).toContain("--ory-theme-accent-def: #3d53f5;");
    expect(css).toContain("--ory-theme-background-surface: #ffffff;");
    expect(css).toContain("--ory-theme-error-def: #df1642;");
  });

  it("skips invalid hex values rather than emitting them", () => {
    const css = themeToCss({ ...DEFAULT_THEME, accent: "blue" });
    expect(css).not.toContain("--ory-theme-accent-def");
    // valid tokens still present
    expect(css).toContain("--ory-theme-background-surface");
  });
});

describe("validateThemeTokens", () => {
  it("accepts the default palette and rejects non-hex", () => {
    expect(() => validateThemeTokens(DEFAULT_THEME)).not.toThrow();
    expect(() =>
      validateThemeTokens({ ...DEFAULT_THEME, surface: "white" }),
    ).toThrow(/Invalid color/);
  });
});
