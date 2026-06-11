/** Map a CSV upload to identity inputs. Pure + testable. */

import { parseCsv } from "./csv";

export interface ImportRow {
  email: string;
  first?: string;
  last?: string;
}

/**
 * Parse an identity-import CSV. Requires a header row containing an "email"
 * column; "first"/"last" are optional. Header matching is case-insensitive.
 */
export function parseIdentityCsv(text: string): ImportRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new Error("The CSV is empty");
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf("email");
  if (emailIdx === -1) {
    throw new Error('The CSV must have an "email" column header');
  }
  const firstIdx = header.indexOf("first");
  const lastIdx = header.indexOf("last");

  const out: ImportRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    const email = (cells[emailIdx] ?? "").trim();
    if (!email) continue; // skip rows without an email
    out.push({
      email,
      first: firstIdx === -1 ? undefined : cells[firstIdx]?.trim() || undefined,
      last: lastIdx === -1 ? undefined : cells[lastIdx]?.trim() || undefined,
    });
  }
  return out;
}
