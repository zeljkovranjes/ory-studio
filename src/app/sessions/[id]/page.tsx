import Link from "next/link";
import { getSession, identityIdentifier } from "@/lib/kratos";
import { aalLabel } from "@/lib/session-display";
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

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await currentTenant();

  let session;
  try {
    session = await getSession(tenant, id);
  } catch (err) {
    return (
      <Card>
        <ErrorState message={(err as Error).message} />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Session"
        description={`Session ${session.id}`}
      />
      <div className="mb-4">
        <Link href="/sessions" className="text-sm text-fg-muted hover:text-accent">
          ← Back to sessions
        </Link>
      </div>

      <Card title="Overview">
        <dl className="grid max-w-2xl grid-cols-[10rem_1fr] gap-y-3 text-sm">
          <dt className="text-fg-muted">Identity</dt>
          <dd>
            {session.identity ? (
              <Link
                href={`/identities/${session.identity.id}`}
                className="font-medium hover:text-accent hover:underline"
              >
                {identityIdentifier(session.identity)}
              </Link>
            ) : (
              "—"
            )}
          </dd>
          <dt className="text-fg-muted">Status</dt>
          <dd>
            <Badge tone={session.active ? "success" : "muted"}>
              {session.active ? "active" : "inactive"}
            </Badge>
          </dd>
          <dt className="text-fg-muted">Assurance level</dt>
          <dd>{aalLabel(session.authenticator_assurance_level)}</dd>
          <dt className="text-fg-muted">Authenticated</dt>
          <dd>
            <RelativeTime iso={session.authenticated_at} />
          </dd>
          <dt className="text-fg-muted">Issued</dt>
          <dd>
            <RelativeTime iso={session.issued_at} />
          </dd>
          <dt className="text-fg-muted">Expires</dt>
          <dd>{new Date(session.expires_at).toLocaleString()}</dd>
        </dl>
      </Card>

      <Card title="Authentication methods">
        {session.authentication_methods?.length ? (
          <Table headers={["Method", "Completed"]}>
            {session.authentication_methods.map((m, i) => (
              <tr key={`${m.method}:${i}`}>
                <td className="px-3 py-2 font-medium">{m.method}</td>
                <td className="px-3 py-2 text-fg-muted">
                  {m.completed_at ? <RelativeTime iso={m.completed_at} /> : "—"}
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState message="No authentication methods recorded." />
        )}
      </Card>

      <Card title="Devices">
        {session.devices?.length ? (
          <Table headers={["IP address", "Location", "User agent"]}>
            {session.devices.map((d, i) => (
              <tr key={i}>
                <td className="px-3 py-2 font-mono text-xs">
                  {d.ip_address ?? "—"}
                </td>
                <td className="px-3 py-2 text-fg-muted">
                  {d.location ?? "unknown"}
                </td>
                <td className="px-3 py-2 text-xs text-fg-subtle">
                  {d.user_agent ?? "—"}
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState message="No device information recorded." />
        )}
      </Card>
    </>
  );
}
