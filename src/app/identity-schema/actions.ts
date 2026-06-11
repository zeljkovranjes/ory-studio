"use server";

import { saveKratosPatches } from "@/lib/config-engine";
import { readKratosRaw } from "@/lib/kratos-config";
import { listIdentitySchemas } from "@/lib/kratos";
import { currentTenant } from "@/lib/tenant";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/identity-schema";

interface SchemaListEntry {
  id?: string;
}

export async function setDefaultSchemaAction(
  formData: FormData,
): Promise<void> {
  const schemaId = String(formData.get("schema_id") ?? "").trim();

  // Validate against the schemas Kratos actually serves — never write an id
  // that isn't published, which would break the login flow.
  const tenant = await currentTenant();
  const config = await readKratosRaw();
  const configured =
    "error" in config
      ? []
      : ((config.identity as { schemas?: SchemaListEntry[] } | undefined)
          ?.schemas ?? []);
  const served = await listIdentitySchemas(tenant);
  const validIds = new Set<string>([
    ...configured.map((s) => s.id).filter((x): x is string => Boolean(x)),
    ...served.items.map((s) => s.id),
  ]);

  if (!validIds.has(schemaId)) {
    flashRedirect(PAGE, {
      ok: false,
      error: `Unknown schema "${schemaId}". Pick one of the configured schemas.`,
    });
  }

  const result = await saveKratosPatches([
    { path: ["identity", "default_schema_id"], value: schemaId },
  ]);
  flashRedirect(PAGE, result);
}
