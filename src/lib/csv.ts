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

/**
 * Parse CSV text into rows of fields. Handles quoted fields containing commas,
 * escaped quotes (""), and newlines. Blank trailing lines are dropped.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
    } else if (c === ",") {
      endField();
      i++;
    } else if (c === "\r") {
      i++; // handled by the following \n (or treat lone \r as row end)
      if (text[i] !== "\n") endRow();
    } else if (c === "\n") {
      endRow();
      i++;
    } else {
      field += c;
      i++;
    }
  }
  // flush the final field/row if there is pending content
  if (field.length > 0 || row.length > 0) endRow();

  // drop fully-empty rows (e.g. trailing blank line)
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}
