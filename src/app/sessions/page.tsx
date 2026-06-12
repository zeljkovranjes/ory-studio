import Link from "next/link";
import { identityIdentifier, listSessions } from "@/lib/kratos";
import { parseActiveFilter } from "@/lib/session-filter";
import { currentTenant } from "@/lib/tenant";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  RelativeTime,
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
    active?: string;
    saved?: string;
    warning?: string;
    error?: string;
  }>;
}) {
  const { page_token, active: activeParam, ...flash } = await searchParams;
  const active = parseActiveFilter(activeParam);
  const tenant = await currentTenant();
  const result = await listSessions(tenant, { pageToken: page_token, active });

  return (
    <>
      <PageHeader
        title="Sessions"
        description="View sessions for your identities. Sessions are created when an identity authenticates with your application. Expired sessions are automatically deleted."
      />
      <Flash {...flash} />
      <Card>
        <form className="mb-4 flex items-center gap-2" action="/sessions">
          <label className="text-sm text-fg-muted">Show</label>
          <select
            name="active"
            defaultValue={activeParam ?? "all"}
            className="h-9 rounded border border-border bg-surface px-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="all">All sessions</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
          <button
            type="submit"
            className="h-9 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
          >
            Filter
          </button>
        </form>

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
                    <RelativeTime iso={session.authenticated_at} />
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
                    <span className="flex items-center justify-end gap-3">
                      <Link
                        href={`/sessions/${session.id}`}
                        className="text-sm text-fg-muted hover:text-accent"
                      >
                        Details
                      </Link>
                      {session.active ? (
                        <form action={revokeSessionAction}>
                          <input
                            type="hidden"
                            name="session_id"
                            value={session.id}
                          />
                          <input
                            type="hidden"
                            name="redirect_to"
                            value="/sessions"
                          />
                          <button
                            type="submit"
                            className="rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg hover:bg-bg-subtle"
                          >
                            Revoke
                          </button>
                        </form>
                      ) : null}
                    </span>
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
              ? `/sessions?${new URLSearchParams({
                  ...(activeParam && activeParam !== "all"
                    ? { active: activeParam }
                    : {}),
                  page_token: result.nextPageToken,
                })}`
              : null
          }
        />
      </Card>
    </>
  );
}
