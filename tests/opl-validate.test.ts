import { describe, expect, it } from "vitest";
import {
  firstOplError,
  isValidOpl,
  validateOpl,
} from "@/lib/opl-validate";

const VALID = `import { Namespace, Context } from "@ory/keto-namespace-types"

class User implements Namespace {}

class Organization implements Namespace {
  related: {
    members: User[]
  }
  permits = {
    view: (ctx: Context): boolean =>
      this.related.members.includes(ctx.subject),
  }
}
`;

describe("validateOpl", () => {
  it("accepts a valid namespace file", () => {
    expect(validateOpl(VALID)).toEqual([]);
    expect(isValidOpl(VALID)).toBe(true);
    expect(firstOplError(VALID)).toBeNull();
  });

  it("flags a missing Namespace class", () => {
    const err = firstOplError("const x = 1\n");
    expect(err).toMatch(/must define at least one namespace/);
  });

  it("detects an unclosed brace", () => {
    const src = "class User implements Namespace {\n";
    const diags = validateOpl(src);
    expect(diags.some((d) => /Unclosed/.test(d.message))).toBe(true);
    expect(isValidOpl(src)).toBe(false);
  });

  it("detects a mismatched bracket", () => {
    const src = "class User implements Namespace { related: [ ) }";
    expect(validateOpl(src).some((d) => /Mismatched/.test(d.message))).toBe(
      true,
    );
  });

  it("detects an unexpected closing bracket", () => {
    const src = "class User implements Namespace {} )";
    expect(
      validateOpl(src).some((d) => /Unexpected closing/.test(d.message)),
    ).toBe(true);
  });

  it("ignores braces inside strings and comments", () => {
    const src = `class User implements Namespace {}
// a comment with { unbalanced
const s = "another { brace"
/* block } comment */
`;
    expect(isValidOpl(src)).toBe(true);
  });

  it("warns on lowercase namespace names but does not block saving", () => {
    const src = "class user implements Namespace {}";
    const diags = validateOpl(src);
    expect(diags.some((d) => d.severity === "warning")).toBe(true);
    expect(isValidOpl(src)).toBe(true); // warnings don't block
  });
});
