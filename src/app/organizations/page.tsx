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
import { createOrgAction, deleteOrgAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const tenant = await currentTenant();

  let orgs: Awaited<ReturnType<typeof listOrganizations>> = [];
  let dbError: string | null = null;
  try {
    orgs = await listOrganizations(tenant.id);
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

      <Card title="All organizations">
        {dbError ? (
          <ErrorState message={`Organization store unavailable: ${dbError}`} />
        ) : orgs.length === 0 ? (
          <EmptyState message="No organizations yet. Create one below." />
        ) : (
          <Table headers={["Name", "Domains", "Created", ""]}>
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium">{org.name}</td>
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
                  {new Date(org.created_at).toLocaleDateString()}
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
