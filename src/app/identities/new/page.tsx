import { listIdentitySchemas } from "@/lib/kratos";
import { currentTenant } from "@/lib/tenant";
import { Card, PageHeader } from "@/components/ui";
import { CreateIdentityForm } from "./CreateIdentityForm";

export const dynamic = "force-dynamic";

export default async function NewIdentityPage() {
  const tenant = await currentTenant();
  const schemas = await listIdentitySchemas(tenant);
  const schemaIds =
    schemas.items.length > 0
      ? schemas.items.map((schema) => schema.id)
      : ["default"];

  return (
    <>
      <PageHeader
        title="Create identity"
        description="Creates an identity through the Kratos admin API. The simple fields fit the default schema; use raw traits JSON for custom schemas."
      />
      <Card>
        <CreateIdentityForm schemaIds={schemaIds} />
      </Card>
    </>
  );
}
