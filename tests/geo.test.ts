import { describe, expect, it } from "vitest";
import { classifyIp } from "@/lib/geo";

describe("classifyIp", () => {
  it("labels private and loopback addresses as local", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "192.168.0.5",
      "172.16.0.1",
      "172.31.255.254",
      "169.254.1.1",
      "::1",
      "fd00::1",
      "fe80::1",
    ]) {
      expect(classifyIp(ip)).toBe("Local network");
    }
  });

  it("returns null for public addresses (needs a geo DB to resolve)", () => {
    for (const ip of ["8.8.8.8", "203.0.113.7", "172.32.0.1", "2606:4700::1"]) {
      expect(classifyIp(ip)).toBeNull();
    }
  });

  it("returns null for empty / malformed input", () => {
    expect(classifyIp(null)).toBeNull();
    expect(classifyIp(undefined)).toBeNull();
    expect(classifyIp("")).toBeNull();
    expect(classifyIp("not-an-ip")).toBeNull();
  });
});
