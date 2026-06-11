import { describe, expect, it } from "vitest";
import { orgObjectKey, roleLabel } from "@/lib/organizations";

describe("orgObjectKey", () => {
  it("builds a stable Keto object key", () => {
    expect(orgObjectKey("abc")).toBe("org:abc");
  });
});

describe("roleLabel", () => {
  it("maps Keto relations to singular role labels", () => {
    expect(roleLabel("admins")).toBe("admin");
    expect(roleLabel("members")).toBe("member");
  });

  it("passes through unknown relations unchanged", () => {
    expect(roleLabel("owners")).toBe("owners");
    expect(roleLabel("")).toBe("");
  });
});
