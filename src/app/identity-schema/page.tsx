import { listIdentitySchemas } from "@/lib/kratos";
import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { summarizeSchemaTraits } from "@/lib/identity-schema";
import { currentTenant } from "@/lib/tenant";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
} from "@/components/ui";
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
          const fields = summarizeSchemaTraits(schema.schema);
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

              {fields.length > 0 ? (
                <div className="mb-4">
                  <Table headers={["Field", "Type", "Required", "Roles"]}>
                    {fields.map((f) => (
                      <tr key={f.name}>
                        <td className="px-3 py-2 font-medium">
                          {f.name}
                          {f.title ? (
                            <span className="ml-2 text-xs text-fg-subtle">
                              {f.title}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-fg-muted">
                          {f.type}
                        </td>
                        <td className="px-3 py-2">
                          {f.required ? (
                            <Badge tone="muted">required</Badge>
                          ) : (
                            <span className="text-fg-subtle">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className="flex flex-wrap gap-1">
                            {f.identifier ? (
                              <Badge tone="success">login</Badge>
                            ) : null}
                            {f.recovery ? <Badge tone="muted">recovery</Badge> : null}
                            {f.verification ? (
                              <Badge tone="muted">verification</Badge>
                            ) : null}
                            {!f.identifier && !f.recovery && !f.verification ? (
                              <span className="text-fg-subtle">—</span>
                            ) : null}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </Table>
                </div>
              ) : null}

              <details>
                <summary className="cursor-pointer text-sm text-fg-muted hover:text-fg">
                  Raw JSON Schema
                </summary>
                <pre className="mt-2 max-h-96 overflow-auto rounded bg-canvas p-3 font-mono text-xs">
                  {JSON.stringify(schema.schema, null, 2)}
                </pre>
              </details>
            </Card>
          );
        })
      )}
    </>
  );
}
