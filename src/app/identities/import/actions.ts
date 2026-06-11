"use server";

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

export async function importIdentitiesAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const tenant = await currentTenant();
  const schemaId = String(formData.get("schema_id") ?? "default");

  let rows;
  try {
    rows = parseIdentityCsv(String(formData.get("csv") ?? ""));
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
