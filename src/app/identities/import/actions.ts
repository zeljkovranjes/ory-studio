"use server";

import { requireSession } from "@/lib/require-session";

import { createIdentity } from "@/lib/kratos";
import { buildTraits } from "@/lib/identity-traits";
import { parseIdentityCsv } from "@/lib/identity-import";
import { currentTenant } from "@/lib/tenant";

export interface ImportState {
  error?: string;
  created?: number;
  failed?: { email: string; reason: string }[];
}

const MAX_ROWS = 1000;
// Reject oversized payloads before parsing so a large upload can't burn CPU/memory
// just to be rejected on the row count afterwards. ~1000 rows fits comfortably here.
const MAX_CSV_BYTES = 1_000_000;

export async function importIdentitiesAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireSession();
  const tenant = await currentTenant();
  const schemaId = String(formData.get("schema_id") ?? "default");

  const csv = String(formData.get("csv") ?? "");
  if (csv.length > MAX_CSV_BYTES) {
    return { error: "The CSV is too large; import up to 1MB at a time" };
  }

  let rows;
  try {
    rows = parseIdentityCsv(csv);
  } catch (err) {
    return { error: (err as Error).message };
  }
  if (rows.length === 0) return { error: "No identities found in the CSV" };
  if (rows.length > MAX_ROWS) {
    return { error: `Too many rows (${rows.length}); import up to ${MAX_ROWS}` };
  }

  let created = 0;
  const failed: { email: string; reason: string }[] = [];
  for (const row of rows) {
    try {
      const traits = buildTraits({
        email: row.email,
        first: row.first,
        last: row.last,
      });
      await createIdentity(tenant, { schemaId, traits });
      created++;
    } catch (err) {
      failed.push({ email: row.email, reason: (err as Error).message });
    }
  }
  return { created, failed };
}
