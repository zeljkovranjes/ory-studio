import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

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
