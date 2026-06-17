import Link from "next/link";
import { listSamlConnections } from "@/lib/saml";
import { listOrganizations } from "@/lib/organizations";
import { currentTenant } from "@/lib/tenant";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
} from "@/components/ui";
import { Flash, SaveButton, TextField } from "@/components/forms";
import { createSamlAction, deleteSamlAction, toggleSamlAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SamlPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const tenant = await currentTenant();

  let connections: Awaited<ReturnType<typeof listSamlConnections>> = [];
  const orgNames = new Map<string, string>();
  let dbError: string | null = null;
  try {
    const [conns, orgs] = await Promise.all([
      listSamlConnections(tenant.id),
      listOrganizations(tenant.id).catch(() => []),
    ]);
    connections = conns;
    for (const o of orgs) orgNames.set(o.id, o.name);
  } catch (err) {
    dbError = (err as Error).message;
  }

  return (
    <>
      <PageHeader
        title="Security Assertion Markup Language (SAML)"
        description="SAML lets enterprise identity providers authenticate your users. Connections are registered here and exposed to Kratos as OIDC providers. Add an IdP below — point it at its metadata URL or entity ID."
      />
      <Flash {...flash} />

      <Card title="SAML connections">
        {dbError ? (
          <ErrorState message={`SAML store unavailable: ${dbError}`} />
        ) : connections.length === 0 ? (
          <EmptyState message="No SAML connections yet. Add one below." />
        ) : (
          <Table headers={["Name", "Protocol", "Scope", "Endpoint", "Status", ""]}>
            {connections.map((c) => (
              <tr key={c.id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">
                  <Badge tone="muted">{c.protocol.toUpperCase()}</Badge>
                </td>
                <td className="px-4 py-3 text-sm">
                  {c.org_id ? (
                    <Link
                      href={`/organizations/${c.org_id}`}
                      className="text-accent hover:underline"
                    >
                      {orgNames.get(c.org_id) ?? `org ${c.org_id}`}
                    </Link>
                  ) : (
                    <span className="text-fg-muted">Global</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {c.protocol === "oidc"
                    ? (c.oidc_issuer_url ?? "—")
                    : (c.idp_metadata_url ?? c.idp_entity_id ?? "—")}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={c.enabled ? "success" : "muted"}>
                    {c.enabled ? "enabled" : "disabled"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <form action={toggleSamlAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        type="hidden"
                        name="enabled"
                        value={(!c.enabled).toString()}
                      />
                      <button
                        type="submit"
                        className="text-sm text-accent hover:underline"
                      >
                        {c.enabled ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <form action={deleteSamlAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="text-sm text-error hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card
        title="Add SAML connection"
        description="Provide the identity provider's SAML metadata URL (preferred) or its entity ID. The connection is exposed to Kratos as an OIDC provider."
      >
        <form action={createSamlAction} className="max-w-xl">
          <TextField name="name" label="Connection name" placeholder="Acme Okta" />
          <TextField
            name="idp_metadata_url"
            label="IdP metadata URL"
            placeholder="https://idp.acme.com/app/metadata"
            mono
            wide
          />
          <TextField
            name="idp_entity_id"
            label="IdP entity ID (optional)"
            placeholder="https://idp.acme.com/entity"
            mono
            wide
          />
          <SaveButton label="Add connection" />
        </form>
      </Card>
    </>
  );
}
