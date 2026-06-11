import { Badge, Card, PageHeader, Table } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function MembersPage() {
  const adminUser = process.env.STUDIO_ADMIN_USER ?? "admin";
  const authEnabled = Boolean(process.env.STUDIO_ADMIN_PASSWORD);

  return (
    <>
      <PageHeader
        title="Members"
        description="Who can access this studio. In single-tenant mode there is one administrator, authenticated by the browser login prompt."
      />
      <Card>
        <Table headers={["User", "Role", "Authentication"]}>
          <tr>
            <td className="px-3 py-2 font-medium">{adminUser}</td>
            <td className="px-3 py-2 text-fg-muted">Owner</td>
            <td className="px-3 py-2">
              {authEnabled ? (
                <Badge tone="success">HTTP Basic auth</Badge>
              ) : (
                <Badge tone="error">open — set STUDIO_ADMIN_PASSWORD</Badge>
              )}
            </td>
          </tr>
        </Table>
        <p className="mt-4 text-sm text-fg-muted">
          Credentials come from <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">STUDIO_ADMIN_USER</code> and{" "}
          <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">STUDIO_ADMIN_PASSWORD</code>.
          Multi-member access management arrives with the multi-tenant milestone.
        </p>
      </Card>
    </>
  );
}
