import { listIdentitySchemas } from "@/lib/kratos";
import { currentTenant } from "@/lib/tenant";
import { Card, PageHeader } from "@/components/ui";
import { ImportForm } from "./ImportForm";

export const dynamic = "force-dynamic";

export default async function ImportIdentitiesPage() {
  const tenant = await currentTenant();
  const schemas = await listIdentitySchemas(tenant);
  const schemaIds =
    schemas.items.length > 0
      ? schemas.items.map((s) => s.id)
      : ["default"];

  return (
    <>
      <PageHeader
        title="Import identities"
        description="Bulk-create identities from a CSV. Each row becomes an identity via the Kratos admin API; failures are reported per row without stopping the rest."
      />
      <Card>
        <ImportForm schemaIds={schemaIds} />
      </Card>
    </>
  );
}
