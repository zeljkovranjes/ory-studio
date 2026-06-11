import { listRelationships } from "@/lib/keto";
import {
  getOrganization,
  ORG_NAMESPACE,
  ORG_RELATIONS,
  orgObjectKey,
} from "@/lib/organizations";
import { listSamlConnectionsForOrg } from "@/lib/saml";
import { currentTenant } from "@/lib/tenant";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
} from "@/components/ui";
import { Flash, SaveButton, SelectField, TextField } from "@/components/forms";
import {
  addMemberAction,
  addOrgSsoAction,
  removeMemberAction,
  removeOrgSsoAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  const tenant = await currentTenant();

  const org = await getOrganization(tenant.id, id).catch(() => null);
  if (!org) {
    return (
      <Card>
        <ErrorState message="Organization not found." />
      </Card>
    );
  }

  const [result, ssoConnections] = await Promise.all([
    listRelationships(tenant, {
      namespace: ORG_NAMESPACE,
      object: orgObjectKey(id),
    }),
    listSamlConnectionsForOrg(tenant.id, org.id).catch(() => []),
  ]);
  const members = result.items
    .filter((t) => t.subject_id)
    .map((t) => ({ subject: t.subject_id as string, relation: t.relation }));

  return (
    <>
      <PageHeader title={org.name} description={`Organization ${org.id}`} />
      <Flash {...flash} />

      <Card title="Details">
        <dl className="grid max-w-xl grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-fg-muted">Domains</dt>
          <dd className="flex flex-wrap gap-1">
            {org.domains.length === 0 ? (
              <span className="text-fg-subtle">—</span>
            ) : (
              org.domains.map((d) => (
                <Badge key={d} tone="muted">
                  {d}
                </Badge>
              ))
            )}
          </dd>
          <dt className="text-fg-muted">Created</dt>
          <dd>{new Date(org.created_at).toLocaleString()}</dd>
        </dl>
      </Card>

      <Card
        title="Members"
        description="Membership is stored as Keto relationships in the Organization namespace, so your permission rules can authorize against it."
      >
        {result.error ? (
          <ErrorState message={`Could not reach Keto: ${result.error}`} />
        ) : members.length === 0 ? (
          <EmptyState message="No members yet. Add one below." />
        ) : (
          <Table headers={["Subject", "Role", ""]}>
            {members.map((m) => (
              <tr key={`${m.relation}:${m.subject}`} className="hover:bg-canvas">
                <td className="px-4 py-3 font-mono text-xs">{m.subject}</td>
                <td className="px-4 py-3">
                  <Badge tone={m.relation === "admins" ? "success" : "muted"}>
                    {m.relation === "admins" ? "admin" : "member"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={removeMemberAction}>
                    <input type="hidden" name="org_id" value={org.id} />
                    <input type="hidden" name="relation" value={m.relation} />
                    <input type="hidden" name="subject_id" value={m.subject} />
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

      <Card title="Add member">
        <form action={addMemberAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="org_id" value={org.id} />
          <TextField
            name="subject_id"
            label="Subject (identity id)"
            placeholder="identity uuid…"
            mono
          />
          <SelectField
            name="relation"
            label="Role"
            defaultValue="members"
            options={ORG_RELATIONS.map((r) => ({
              value: r,
              label: r === "admins" ? "admin" : "member",
            }))}
          />
          <SaveButton label="Add member" />
        </form>
      </Card>

      <Card
        title="SSO connections"
        description="SAML identity providers scoped to this organization. Users in this org's domains are routed to its enabled connections."
      >
        {ssoConnections.length === 0 ? (
          <EmptyState message="No SSO connections for this organization yet." />
        ) : (
          <Table headers={["Name", "IdP", "Status", ""]}>
            {ssoConnections.map((c) => (
              <tr key={c.id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {c.idp_metadata_url ?? c.idp_entity_id ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={c.enabled ? "success" : "muted"}>
                    {c.enabled ? "enabled" : "disabled"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={removeOrgSsoAction}>
                    <input type="hidden" name="org_id" value={org.id} />
                    <input type="hidden" name="id" value={c.id} />
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
        <form
          action={addOrgSsoAction}
          className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4"
        >
          <input type="hidden" name="org_id" value={org.id} />
          <TextField name="name" label="Connection name" placeholder="Acme Okta" />
          <TextField
            name="idp_metadata_url"
            label="IdP metadata URL"
            placeholder="https://idp.acme.com/metadata"
            mono
          />
          <TextField
            name="idp_entity_id"
            label="Entity ID (optional)"
            mono
          />
          <SaveButton label="Add connection" />
        </form>
      </Card>
    </>
  );
}
