import Link from "next/link";
import { listCourierMessages } from "@/lib/kratos";
import { COURIER_STATUSES, courierStatusFilter } from "@/lib/courier";
import { currentTenant } from "@/lib/tenant";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
} from "@/components/ui";
import { Pagination } from "@/components/Pagination";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  sent: "success",
  queued: "muted",
  processing: "muted",
  abandoned: "error",
} as const;

export default async function EmailDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ page_token?: string; status?: string }>;
}) {
  const { page_token, status: statusParam } = await searchParams;
  const status = courierStatusFilter(statusParam);
  const tenant = await currentTenant();
  const result = await listCourierMessages(tenant, {
    pageToken: page_token,
    status,
  });

  return (
    <>
      <PageHeader
        title="Message delivery"
        description="View messages (email and SMS) sent to your users by self-service flows. Elevated Abandoned rates usually point at a delivery provider problem."
      />
      <Card>
        <form className="mb-4 flex items-center gap-2" action="/email-delivery">
          <label className="text-sm text-fg-muted">Status</label>
          <select
            name="status"
            defaultValue={status ?? "all"}
            className="h-9 rounded border border-border bg-surface px-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="all">All</option>
            {COURIER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
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
          <EmptyState message="No messages match. Recovery and verification emails appear here." />
        ) : (
          <Table
            headers={["Recipient", "Type", "Template", "Status", "Created"]}
          >
            {result.items.map((message) => (
              <tr key={message.id} className="hover:bg-canvas">
                <td className="px-3 py-2 font-medium">
                  <Link
                    href={`/email-delivery/${message.id}`}
                    className="hover:text-accent hover:underline"
                  >
                    {message.recipient}
                  </Link>
                </td>
                <td className="px-3 py-2 text-fg-muted">{message.type}</td>
                <td className="px-3 py-2 text-fg-muted">
                  {message.template_type}
                </td>
                <td className="px-3 py-2">
                  <Badge tone={STATUS_TONE[message.status] ?? "muted"}>
                    {message.status}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-fg-muted">
                  {new Date(message.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </Table>
        )}

        <Pagination
          pageSize={25}
          nextHref={
            result.nextPageToken
              ? `/email-delivery?${new URLSearchParams({
                  ...(status ? { status } : {}),
                  page_token: result.nextPageToken,
                })}`
              : null
          }
        />
      </Card>
    </>
  );
}
