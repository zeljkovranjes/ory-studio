import { describe, expect, it } from "vitest";
import { buildCourierPatches } from "@/lib/email-templates";

describe("buildCourierPatches", () => {
  it("writes subject and both body parts as base64 under the valid email variant", () => {
    const patches = buildCourierPatches(
      "recovery_code",
      "Your code",
      "Code: {{ .RecoveryCode }}",
    );
    expect(patches).toHaveLength(3);

    const subject = patches.find((p) => p.path.at(-1) === "subject");
    expect(subject?.path).toEqual([
      "courier",
      "templates",
      "recovery_code",
      "valid",
      "email",
      "subject",
    ]);
    expect(String(subject?.value).startsWith("base64://")).toBe(true);
    // decodes back to the original
    const encoded = String(subject?.value).slice("base64://".length);
    expect(Buffer.from(encoded, "base64").toString("utf8")).toBe("Your code");

    expect(patches.some((p) => p.path.at(-1) === "html")).toBe(true);
    expect(patches.some((p) => p.path.at(-1) === "plaintext")).toBe(true);
  });
});
