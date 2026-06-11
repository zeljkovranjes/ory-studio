/** Minimal RFC-4180 CSV serialization. */

function escapeField(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Build a CSV document from a header row and data rows. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeField).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeField).join(","));
  }
  // CRLF line endings per the spec; trailing newline for POSIX friendliness.
  return lines.join("\r\n") + "\r\n";
}
