import { identityIdentifier, listSessions } from "@/lib/kratos";
import { currentTenant } from "@/lib/tenant";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
} from "@/components/ui";
import { Flash } from "@/components/forms";
import { Pagination } from "@/components/Pagination";
import { revokeSessionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page_token?: string;
    saved?: string;
    warning?: string;
    error?: string;
  }>;
}) {
  const { page_token, ...flash } = await searchParams;
  const tenant = await currentTenant();
  const result = await listSessions(tenant, { pageToken: page_token });

  return (
    <>
      <PageHeader
        title="Sessions"
        description="View sessions for your identities. Sessions are created when an identity authenticates with your application. Expired sessions are automatically deleted."
      />
      <Flash {...flash} />
      <Card>
        {result.error ? (
          <ErrorState
            message={`Could not reach Kratos admin API: ${result.error}`}
          />
        ) : result.items.length === 0 ? (
          <EmptyState message="No sessions yet. They appear here when users sign in." />
        ) : (
          <Table
            headers={[
              "Identity",
              "Active",
              "AAL",
              "Authenticated",
              "Expires",
              "Device",
              "",
            ]}
          >
            {result.items.map((session) => {
              const device = session.devices?.[0];
              return (
                <tr key={session.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-medium">
                    {session.identity ? (
                      <span className="flex items-center gap-3">
                        <Avatar
                          seed={session.identity.id}
                          label={identityIdentifier(session.identity)}
                        />
                        {identityIdentifier(session.identity)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={session.active ? "success" : "muted"}>
                      {session.active ? "active" : "inactive"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-fg-muted">
                    {session.authenticator_assurance_level}
                  </td>
                  <td className="px-3 py-2 text-fg-muted">
                    {new Date(session.authenticated_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-fg-muted">
                    {new Date(session.expires_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-xs text-fg-subtle">
                    {device
                      ? `${device.ip_address ?? "?"} · ${device.location ?? "unknown location"}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {session.active ? (
                      <form action={revokeSessionAction}>
                        <input
                          type="hidden"
                          name="session_id"
                          value={session.id}
                        />
                        <input type="hidden" name="redirect_to" value="/sessions" />
                        <button
                          type="submit"
                          className="rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg hover:bg-bg-subtle"
                        >
                          Revoke
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}

        <Pagination
          pageSize={25}
          nextHref={
            result.nextPageToken
              ? `/sessions?page_token=${result.nextPageToken}`
              : null
          }
        />
      </Card>
    </>
  );
}
