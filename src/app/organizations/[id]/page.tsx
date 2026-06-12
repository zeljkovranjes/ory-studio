import Link from "next/link";
import { checkPermission, listRelationships } from "@/lib/keto";
import { getIdentity, identityIdentifier } from "@/lib/kratos";
import {
  getOrganization,
  ORG_NAMESPACE,
  ORG_RELATIONS,
  orgObjectKey,
  roleLabel,
} from "@/lib/organizations";
import { listSamlConnectionsForOrg } from "@/lib/saml";
import { currentTenant } from "@/lib/tenant";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  RelativeTime,
  Table,
} from "@/components/ui";
import { Flash, SaveButton, SelectField, TextField } from "@/components/forms";
import {
  addMemberAction,
  removeMemberAction,
  removeOrgSsoAction,
} from "./actions";
import { OrgSsoForm } from "./OrgSsoForm";

export const dynamic = "force-dynamic";

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    warning?: string;
    error?: string;
    check_subject?: string;
    check_relation?: string;
  }>;
}) {
  const { id } = await params;
  const { check_subject, check_relation, ...flash } = await searchParams;
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
  // Resolve each member's identity id to a human label (email/username),
  // falling back to the raw id when it isn't a resolvable identity.
  const members = await Promise.all(
    result.items
      .filter((t) => t.subject_id)
      .map(async (t) => {
        const subject = t.subject_id as string;
        const identity = await getIdentity(tenant, subject).catch(() => null);
        return {
          subject,
          relation: t.relation,
          label: identity ? identityIdentifier(identity) : null,
        };
      }),
  );

  // Authorization check (Keto): does a subject have a given relation/permit?
  const checkRelation = ["members", "admins", "view", "manage"].includes(
    check_relation ?? "",
  )
    ? (check_relation as string)
    : "manage";
  let checkResult: { subject: string; relation: string; allowed: boolean } | null =
    null;
  if (check_subject) {
    try {
      const allowed = await checkPermission(tenant, {
        namespace: ORG_NAMESPACE,
        object: orgObjectKey(id),
        relation: checkRelation,
        subjectId: check_subject,
      });
      checkResult = { subject: check_subject, relation: checkRelation, allowed };
    } catch {
      checkResult = {
        subject: check_subject,
        relation: checkRelation,
        allowed: false,
      };
    }
  }

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
          <dd>
            <RelativeTime iso={org.created_at} />
          </dd>
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
          <Table headers={["Member", "Role", ""]}>
            {members.map((m) => (
              <tr key={`${m.relation}:${m.subject}`} className="hover:bg-canvas">
                <td className="px-4 py-3">
                  <Link
                    href={`/identities/${m.subject}`}
                    className="hover:text-accent hover:underline"
                  >
                    {m.label ? (
                      <span className="font-medium">{m.label}</span>
                    ) : null}
                    <span className="block font-mono text-xs text-fg-subtle">
                      {m.subject}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={m.relation === "admins" ? "success" : "muted"}>
                    {roleLabel(m.relation)}
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
          <Table headers={["Name", "Protocol", "Endpoint", "Status", ""]}>
            {ssoConnections.map((c) => (
              <tr key={c.id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">
                  <Badge tone="muted">{c.protocol.toUpperCase()}</Badge>
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
        <OrgSsoForm orgId={org.id} />
      </Card>

      <Card
        title="Authorization check"
        description="Evaluate an access decision against this organization using Keto. 'view' and 'manage' are OPL permits — manage resolves to admins; view to members or admins."
      >
        <form className="flex flex-wrap items-end gap-3" action={`/organizations/${org.id}`}>
          <TextField
            name="check_subject"
            label="Subject (identity id)"
            defaultValue={check_subject}
            placeholder="identity uuid…"
            mono
          />
          <SelectField
            name="check_relation"
            label="Permission"
            defaultValue={checkRelation}
            options={[
              { value: "manage", label: "manage (permit)" },
              { value: "view", label: "view (permit)" },
              { value: "admins", label: "admins (relation)" },
              { value: "members", label: "members (relation)" },
            ]}
          />
          <button
            type="submit"
            className="h-10 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
          >
            Check
          </button>
        </form>
        {checkResult ? (
          <div className="mt-4 rounded border border-border bg-canvas px-4 py-3 text-sm">
            <code className="font-mono">{checkResult.subject}</code>{" "}
            <span className="text-fg-muted">
              {checkResult.allowed ? "is allowed to" : "is NOT allowed to"}
            </span>{" "}
            <span className="font-medium">{checkResult.relation}</span>{" "}
            <Badge tone={checkResult.allowed ? "success" : "error"}>
              {checkResult.allowed ? "allowed" : "denied"}
            </Badge>
          </div>
        ) : null}
      </Card>
    </>
  );
}
