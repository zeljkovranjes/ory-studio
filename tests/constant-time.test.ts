import { describe, expect, it } from "vitest";
import { timingSafeEqual } from "@/lib/constant-time";

describe("timingSafeEqual", () => {
  it("returns true only for identical strings", () => {
    expect(timingSafeEqual("secret-token", "secret-token")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("returns false for any difference", () => {
    expect(timingSafeEqual("secret", "Secret")).toBe(false);
    expect(timingSafeEqual("secret", "secret ")).toBe(false);
    expect(timingSafeEqual("secret", "")).toBe(false);
    expect(timingSafeEqual("", "secret")).toBe(false);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
  });

  it("handles unicode without throwing", () => {
    expect(timingSafeEqual("café", "café")).toBe(true);
    expect(timingSafeEqual("café", "cafe")).toBe(false);
  });
});
