import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/lib/csv";
import { parseIdentityCsv } from "@/lib/identity-import";

describe("toCsv", () => {
  it("serializes a simple table", () => {
    const csv = toCsv(["a", "b"], [["1", "2"], ["3", "4"]]);
    expect(csv).toBe("a,b\r\n1,2\r\n3,4\r\n");
  });

  it("quotes fields with commas, quotes and newlines", () => {
    const csv = toCsv(
      ["name", "note"],
      [["Acme, Inc.", 'He said "hi"'], ["multi", "line\nbreak"]],
    );
    expect(csv).toContain('"Acme, Inc."');
    expect(csv).toContain('"He said ""hi"""');
    expect(csv).toContain('"line\nbreak"');
  });

  it("renders null/undefined as empty fields", () => {
    expect(toCsv(["x"], [[null], [undefined]])).toBe("x\r\n\r\n\r\n");
  });
});

describe("parseCsv", () => {
  it("parses simple rows", () => {
    expect(parseCsv("a,b\n1,2\n3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("handles quoted fields with commas, quotes and newlines", () => {
    const rows = parseCsv('name,note\r\n"Acme, Inc.","He said ""hi"""\r\n"a","x\ny"');
    expect(rows[1]).toEqual(["Acme, Inc.", 'He said "hi"']);
    expect(rows[2]).toEqual(["a", "x\ny"]);
  });

  it("drops trailing blank lines", () => {
    expect(parseCsv("a\n1\n\n")).toEqual([["a"], ["1"]]);
  });

  it("round-trips with toCsv", () => {
    const doc = toCsv(["id", "name"], [["1", 'a,"b"'], ["2", "c\nd"]]);
    const parsed = parseCsv(doc);
    expect(parsed).toEqual([
      ["id", "name"],
      ["1", 'a,"b"'],
      ["2", "c\nd"],
    ]);
  });
});

describe("parseIdentityCsv", () => {
  it("maps email/first/last columns in any order", () => {
    const rows = parseIdentityCsv("first,email,last\nJane,jane@x.co,Doe\n,john@x.co,");
    expect(rows).toEqual([
      { email: "jane@x.co", first: "Jane", last: "Doe" },
      { email: "john@x.co", first: undefined, last: undefined },
    ]);
  });

  it("requires an email column and skips rows without an email", () => {
    expect(() => parseIdentityCsv("name\nfoo")).toThrow(/email/);
    expect(parseIdentityCsv("email\njane@x.co\n\n")).toEqual([
      { email: "jane@x.co", first: undefined, last: undefined },
    ]);
  });

  it("throws on empty input", () => {
    expect(() => parseIdentityCsv("")).toThrow(/empty/);
  });
});
