import Link from "next/link";
import { getOAuth2Client, splitScopes } from "@/lib/hydra";
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

function BadgeList({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-fg-subtle">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((v) => (
        <Badge key={v} tone="muted">
          {v}
        </Badge>
      ))}
    </span>
  );
}

export default async function OAuthClientDetailPage({
  params,
}: {
  params: Promise<{ client_id: string }>;
}) {
  const { client_id } = await params;
  const tenant = await currentTenant();

  let client;
  try {
    client = await getOAuth2Client(tenant, client_id);
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
        title={client.client_name || "(unnamed client)"}
        description={`OAuth2 client ${client.client_id}`}
      />
      <div className="mb-4">
        <Link href="/oauth" className="text-sm text-fg-muted hover:text-accent">
          ← Back to clients
        </Link>
      </div>

      <Card title="Configuration">
        <dl className="grid max-w-3xl grid-cols-[12rem_1fr] gap-y-3 text-sm">
          <dt className="text-fg-muted">Client ID</dt>
          <dd className="font-mono text-xs">{client.client_id}</dd>
          <dt className="text-fg-muted">Auth method</dt>
          <dd>{client.token_endpoint_auth_method ?? "—"}</dd>
          <dt className="text-fg-muted">Grant types</dt>
          <dd>
            <BadgeList items={client.grant_types ?? []} />
          </dd>
          <dt className="text-fg-muted">Response types</dt>
          <dd>
            <BadgeList items={client.response_types ?? []} />
          </dd>
          <dt className="text-fg-muted">Scopes</dt>
          <dd>
            <BadgeList items={splitScopes(client.scope)} />
          </dd>
          <dt className="text-fg-muted">Audience</dt>
          <dd>
            <BadgeList items={client.audience ?? []} />
          </dd>
          <dt className="text-fg-muted">Created</dt>
          <dd>
            {client.created_at ? (
              <RelativeTime iso={client.created_at} />
            ) : (
              "—"
            )}
          </dd>
        </dl>
      </Card>

      <Card title="Redirect URIs">
        {client.redirect_uris?.length ? (
          <Table headers={["URI"]}>
            {client.redirect_uris.map((uri) => (
              <tr key={uri}>
                <td className="px-3 py-2 font-mono text-xs">{uri}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState message="No redirect URIs configured." />
        )}
      </Card>

      <Card title="Metadata">
        <dl className="grid max-w-3xl grid-cols-[12rem_1fr] gap-y-3 text-sm">
          <dt className="text-fg-muted">Client URI</dt>
          <dd className="font-mono text-xs">{client.client_uri || "—"}</dd>
          <dt className="text-fg-muted">Policy URI</dt>
          <dd className="font-mono text-xs">{client.policy_uri || "—"}</dd>
          <dt className="text-fg-muted">Terms URI</dt>
          <dd className="font-mono text-xs">{client.tos_uri || "—"}</dd>
          <dt className="text-fg-muted">Contacts</dt>
          <dd>
            <BadgeList items={client.contacts ?? []} />
          </dd>
        </dl>
      </Card>
    </>
  );
}
