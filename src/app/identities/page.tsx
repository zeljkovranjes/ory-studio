import Link from "next/link";
import { identityIdentifier, listIdentities } from "@/lib/kratos";
import { countEvents } from "@/lib/events";
import { currentTenant } from "@/lib/tenant";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  RelativeTime,
  StatCard,
  Table,
} from "@/components/ui";
import { SegmentedToggle } from "@/components/forms";
import { Pagination } from "@/components/Pagination";
import { RowMenu } from "@/components/RowMenu";
import { deleteIdentityAction } from "./[id]/actions";

export const dynamic = "force-dynamic";

export default async function IdentitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; match?: string; page_token?: string }>;
}) {
  const { q, match, page_token } = await searchParams;
  const mode = match === "fuzzy" ? "fuzzy" : "exact";
  const tenant = await currentTenant();
  const result = await listIdentities(tenant, {
    identifier: q,
    pageToken: page_token,
  });

  // Pull the 24h signup and login counts together; either may be null if the
  // events database isn't reachable, in which case the card shows a dash.
  const [newSignups, logins] = await Promise.all([
    countEvents("signup", "24h").catch(() => null),
    countEvents("login", "24h").catch(() => null),
  ]);

  return (
    <>
      <PageHeader
        title="Identity data"
        description="Identities are sets of data that describe humans that sign up on a website or an application, for example online store customers, file sharing service users, or company contractors accessing internal systems."
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard
          label="Total identities"
          value={result.totalCount ?? result.items.length}
        />
        <StatCard
          label="New identities (24h)"
          value={newSignups ?? "—"}
          href="/activity"
        />
        <StatCard
          label="Logins (24h)"
          value={logins ?? "—"}
          href="/activity"
        />
      </div>

      <Card>
        <form className="mb-4 flex items-center gap-3" action="/identities">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Filter by identifier..."
            className="h-10 w-72 rounded border border-border px-3 text-sm text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none"
          />
          <SegmentedToggle
            name="match"
            value={mode}
            options={[
              { value: "exact", label: "Exact" },
              { value: "fuzzy", label: "Fuzzy" },
            ]}
          />
          <button
            type="submit"
            className="h-10 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
          >
            Filter
          </button>
          <span className="flex-1" />
          <Link
            href="/identities/import"
            className="flex h-10 items-center rounded border border-border px-4 text-sm font-medium text-fg hover:border-accent hover:text-accent"
          >
            Import
          </Link>
          {/* Route handler returning a file download — a real <a download> is correct. */}
          <a
            href="/identities/export"
            download
            className="flex h-10 items-center rounded border border-border px-4 text-sm font-medium text-fg hover:border-accent hover:text-accent"
          >
            Export CSV
          </a>
          <Link
            href="/identities/new"
            className="flex h-10 items-center rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
          >
            Create identity
          </Link>
        </form>

        {result.error ? (
          <ErrorState
            message={`Could not reach Kratos admin API: ${result.error}`}
          />
        ) : result.items.length === 0 ? (
          <EmptyState message="No identities yet. They appear here when users sign up." />
        ) : (
          <>
            <Table headers={["Name", "Schema", "State", "Created", ""]}>
              {result.items.map((identity) => {
                const label = identityIdentifier(identity);
                return (
                  <tr key={identity.id} className="hover:bg-canvas">
                    <td className="px-4 py-3">
                      <Link
                        href={`/identities/${identity.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar seed={identity.id} label={label} />
                        <span>
                          <span className="block font-medium hover:text-accent">
                            {label}
                          </span>
                          <span className="block font-mono text-xs text-fg-subtle">
                            {identity.id}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      {identity.schema_id}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={identity.state === "active" ? "success" : "muted"}
                      >
                        {identity.state}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      <RelativeTime iso={identity.created_at} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowMenu
                        items={[
                          {
                            label: "View details",
                            href: `/identities/${identity.id}`,
                          },
                          {
                            label: "Delete identity",
                            action: deleteIdentityAction,
                            hiddenFields: { id: identity.id },
                            danger: true,
                            confirm: `Delete ${label}? This cannot be undone.`,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pagination
              pageSize={25}
              rangeLabel={
                result.totalCount
                  ? `1 – ${result.items.length} of ${result.totalCount}`
                  : undefined
              }
              nextHref={
                result.nextPageToken
                  ? `/identities?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(mode === "fuzzy" ? { match: "fuzzy" } : {}),
                      page_token: result.nextPageToken,
                    })}`
                  : null
              }
            />
          </>
        )}
      </Card>
    </>
  );
}
