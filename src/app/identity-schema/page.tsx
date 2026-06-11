import { listIdentitySchemas } from "@/lib/kratos";
import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { currentTenant } from "@/lib/tenant";
import { Badge, Card, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import { Flash } from "@/components/forms";
import { setDefaultSchemaAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function IdentitySchemaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const tenant = await currentTenant();
  const [schemas, config] = await Promise.all([
    listIdentitySchemas(tenant),
    readKratosRaw(),
  ]);
  const defaultSchemaId =
    "error" in config
      ? "default"
      : getPath(config, ["identity", "default_schema_id"], "default");

  return (
    <>
      <PageHeader
        title="Identity schema"
        description="The identity schema defines user profiles using JSON Schema — what data is stored (name, email, phone number), which fields are used to log in, and which are used for recovery and verification. Pick which schema new identities use by default; saving updates Kratos and reloads it."
      />
      <Flash {...flash} />

      {schemas.error ? (
        <Card>
          <ErrorState
            message={`Could not reach Kratos public API: ${schemas.error}`}
          />
        </Card>
      ) : schemas.items.length === 0 ? (
        <Card>
          <EmptyState message="No schemas published by Kratos." />
        </Card>
      ) : (
        schemas.items.map((schema) => {
          const isDefault = schema.id === defaultSchemaId;
          return (
            <Card key={schema.id} title={schema.id}>
              <div className="mb-3 flex items-center justify-between">
                {isDefault ? (
                  <Badge tone="success">default</Badge>
                ) : (
                  <span className="text-sm text-fg-subtle">
                    Not the default schema
                  </span>
                )}
                {isDefault ? null : (
                  <form action={setDefaultSchemaAction}>
                    <input type="hidden" name="schema_id" value={schema.id} />
                    <button
                      type="submit"
                      className="h-8 rounded border border-border bg-surface px-3 text-sm font-medium text-fg hover:border-accent hover:text-accent"
                    >
                      Set as default
                    </button>
                  </form>
                )}
              </div>
              <pre className="max-h-96 overflow-auto rounded bg-canvas p-3 font-mono text-xs">
                {JSON.stringify(schema.schema, null, 2)}
              </pre>
            </Card>
          );
        })
      )}
    </>
  );
}
