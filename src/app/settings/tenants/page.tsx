import { tenancyMode } from "@/lib/tenant";
import { listTenants } from "@/lib/tenants";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
} from "@/components/ui";
import { Flash, SaveButton, TextField } from "@/components/forms";
import { createTenantAction, deleteTenantAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const multi = tenancyMode() === "multi";

  let tenants: Awaited<ReturnType<typeof listTenants>> = [];
  let dbError: string | null = null;
  if (multi) {
    try {
      tenants = await listTenants();
    } catch (err) {
      dbError = (err as Error).message;
    }
  }

  return (
    <>
      <PageHeader
        title="Tenants"
        description="In multi-tenant mode the studio drives several Ory instances. Each tenant defines its own service endpoints and, optionally, the config paths and container names the config engine reloads. Switch the active tenant from the top bar."
      />
      <Flash {...flash} />

      {!multi ? (
        <Card>
          <div className="rounded border border-border bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
            <span className="font-medium text-fg">Single-tenant mode</span>
            <p className="mt-1">
              The studio is running single-tenant (the default). It drives the one
              instance configured via environment variables. Set{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">
                TENANCY_MODE=multi
              </code>{" "}
              to register and switch between multiple tenants here.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card title="Registered tenants">
            {dbError ? (
              <ErrorState message={`Tenant store unavailable: ${dbError}`} />
            ) : tenants.length === 0 ? (
              <EmptyState message="No tenants yet. Add one below." />
            ) : (
              <Table headers={["Name", "Slug", "Kratos admin", "Hydra admin", ""]}>
                {tenants.map((t) => (
                  <tr key={t.slug} className="hover:bg-canvas">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3">
                      <Badge tone="muted">{t.slug}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                      {t.kratos_admin_url}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                      {t.hydra_admin_url ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteTenantAction}>
                        <input type="hidden" name="slug" value={t.slug} />
                        <button
                          type="submit"
                          className="text-sm text-error hover:underline"
                        >
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card
            title="Add tenant"
            description="Service endpoints are required; config paths and container names are optional and default to the studio's environment when omitted."
          >
            <form action={createTenantAction} className="max-w-xl">
              <TextField name="name" label="Name" placeholder="Acme Production" />
              <TextField name="slug" label="Slug" placeholder="acme-prod" mono />
              <TextField
                name="kratos_admin_url"
                label="Kratos admin URL"
                placeholder="http://kratos.acme.internal:4434"
                mono
                wide
              />
              <TextField
                name="kratos_public_url"
                label="Kratos public URL"
                placeholder="https://auth.acme.com"
                mono
                wide
              />
              <TextField
                name="hydra_admin_url"
                label="Hydra admin URL (optional)"
                mono
                wide
              />
              <TextField
                name="keto_read_url"
                label="Keto read URL (optional)"
                mono
                wide
              />
              <TextField
                name="keto_write_url"
                label="Keto write URL (optional)"
                mono
                wide
              />
              <details className="py-2">
                <summary className="cursor-pointer text-sm text-fg-muted">
                  Advanced: config engine paths & container names
                </summary>
                <div className="mt-2 space-y-2">
                  <TextField
                    name="kratos_config_path"
                    label="Kratos config path"
                    mono
                    wide
                  />
                  <TextField
                    name="hydra_config_path"
                    label="Hydra config path"
                    mono
                    wide
                  />
                  <TextField
                    name="keto_namespaces_path"
                    label="Keto namespaces path"
                    mono
                    wide
                  />
                  <TextField
                    name="kratos_container"
                    label="Kratos container name"
                    mono
                  />
                  <TextField
                    name="hydra_container"
                    label="Hydra container name"
                    mono
                  />
                  <TextField
                    name="keto_container"
                    label="Keto container name"
                    mono
                  />
                </div>
              </details>
              <SaveButton label="Add tenant" />
            </form>
          </Card>
        </>
      )}
    </>
  );
}
