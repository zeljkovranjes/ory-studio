import { describe, expect, it } from "vitest";
import { healthReadyUrl } from "@/lib/health";

describe("healthReadyUrl", () => {
  it("appends the readiness path to a base URL", () => {
    expect(healthReadyUrl("http://localhost:4434")).toBe(
      "http://localhost:4434/health/ready",
    );
  });

  it("tolerates a trailing slash (no double slash)", () => {
    expect(healthReadyUrl("http://localhost:4434/")).toBe(
      "http://localhost:4434/health/ready",
    );
    expect(healthReadyUrl("http://kratos:4434///")).toBe(
      "http://kratos:4434/health/ready",
    );
  });

  it("preserves a base path prefix", () => {
    expect(healthReadyUrl("https://ory.example.com/kratos")).toBe(
      "https://ory.example.com/kratos/health/ready",
    );
  });
});
