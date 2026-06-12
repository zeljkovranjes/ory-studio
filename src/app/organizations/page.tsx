import Link from "next/link";
import {
  emailDomain,
  findOrganizationByDomain,
  listOrganizations,
  ORG_NAMESPACE,
  orgObjectKey,
} from "@/lib/organizations";
import { listRelationships } from "@/lib/keto";
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
import { Flash, SaveButton, TextField } from "@/components/forms";
import { createOrgAction, deleteOrgAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    warning?: string;
    error?: string;
    test_email?: string;
  }>;
}) {
  const { test_email, ...flash } = await searchParams;
  const tenant = await currentTenant();

  // Domain → SSO routing preview (home-realm discovery).
  let routing: {
    email: string;
    domain: string | null;
    orgName?: string;
    orgId?: string;
    connections: { name: string; enabled: boolean }[];
  } | null = null;
  if (test_email) {
    const domain = emailDomain(test_email);
    const org = domain
      ? await findOrganizationByDomain(tenant.id, domain).catch(() => null)
      : null;
    const conns = org
      ? (await listSamlConnectionsForOrg(tenant.id, org.id).catch(() => []))
          .filter((c) => c.enabled)
          .map((c) => ({ name: c.name, enabled: c.enabled }))
      : [];
    routing = {
      email: test_email,
      domain,
      orgName: org?.name,
      orgId: org?.id,
      connections: conns,
    };
  }

  let orgs: Awaited<ReturnType<typeof listOrganizations>> = [];
  let dbError: string | null = null;
  const counts = new Map<string, number>();
  try {
    orgs = await listOrganizations(tenant.id);
    await Promise.all(
      orgs.map(async (org) => {
        const rel = await listRelationships(tenant, {
          namespace: ORG_NAMESPACE,
          object: orgObjectKey(org.id),
        });
        counts.set(org.id, rel.items.filter((t) => t.subject_id).length);
      }),
    );
  } catch (err) {
    dbError = (err as Error).message;
  }

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Centralize access management with organizations and Single Sign-On. Group users by company, attach verified email domains, and wire up per-organization SAML or OIDC connections."
      />
      <Flash {...flash} />

      <Card
        title="SSO domain routing"
        description="Preview home-realm discovery: enter an email to see which organization claims its domain and which SSO connections it would route to."
      >
        <form className="flex flex-wrap items-end gap-3" action="/organizations">
          <TextField
            name="test_email"
            label="Email"
            placeholder="jane@acme.com"
            mono
          />
          <button
            type="submit"
            className="h-10 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
          >
            Resolve
          </button>
        </form>
        {routing ? (
          <div className="mt-4 rounded border border-border bg-canvas px-4 py-3 text-sm">
            {!routing.domain ? (
              <span className="text-error">
                &ldquo;{routing.email}&rdquo; is not a valid email address.
              </span>
            ) : !routing.orgName ? (
              <span className="text-fg-muted">
                No organization claims the domain{" "}
                <code className="font-mono">{routing.domain}</code>. The user
                would use the default login.
              </span>
            ) : (
              <div>
                <span className="text-fg-muted">
                  <code className="font-mono">{routing.domain}</code> routes to{" "}
                </span>
                <Link
                  href={`/organizations/${routing.orgId}`}
                  className="font-medium text-accent hover:underline"
                >
                  {routing.orgName}
                </Link>
                <div className="mt-2 flex flex-wrap gap-1">
                  {routing.connections.length === 0 ? (
                    <span className="text-fg-subtle">
                      No enabled SSO connections — falls back to the default login.
                    </span>
                  ) : (
                    routing.connections.map((c) => (
                      <Badge key={c.name} tone="success">
                        {c.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Card>

      <Card title="All organizations">
        {dbError ? (
          <ErrorState message={`Organization store unavailable: ${dbError}`} />
        ) : orgs.length === 0 ? (
          <EmptyState message="No organizations yet. Create one below." />
        ) : (
          <Table headers={["Name", "Members", "Domains", "Created", ""]}>
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/organizations/${org.id}`}
                    className="hover:text-accent hover:underline"
                  >
                    {org.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {counts.get(org.id) ?? 0}
                </td>
                <td className="px-4 py-3">
                  {org.domains.length === 0 ? (
                    <span className="text-fg-subtle">—</span>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {org.domains.map((d) => (
                        <Badge key={d} tone="muted">
                          {d}
                        </Badge>
                      ))}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  <RelativeTime iso={org.created_at} />
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteOrgAction}>
                    <input type="hidden" name="id" value={org.id} />
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
        title="Create organization"
        description="Attach the email domains that map users into this organization. Per-org SSO connections are configured under Authentication → SAML / Social Sign-In."
      >
        <form action={createOrgAction} className="max-w-xl">
          <TextField name="name" label="Name" placeholder="Acme Inc." />
          <TextField
            name="domains"
            label="Email domains"
            description="Space or comma separated, e.g. acme.com acme.io"
            placeholder="acme.com"
            mono
            wide
          />
          <SaveButton label="Create organization" />
        </form>
      </Card>
    </>
  );
}
