import { listCourierMessages } from "@/lib/kratos";
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
  searchParams: Promise<{ page_token?: string }>;
}) {
  const { page_token } = await searchParams;
  const tenant = await currentTenant();
  const result = await listCourierMessages(tenant, { pageToken: page_token });

  return (
    <>
      <PageHeader
        title="Message delivery"
        description="View messages (email and SMS) sent to your users by self-service flows. Elevated Abandoned rates usually point at a delivery provider problem."
      />
      <Card>
        {result.error ? (
          <ErrorState
            message={`Could not reach Kratos admin API: ${result.error}`}
          />
        ) : result.items.length === 0 ? (
          <EmptyState message="No messages yet. Recovery and verification emails appear here." />
        ) : (
          <Table
            headers={["Recipient", "Type", "Template", "Status", "Created"]}
          >
            {result.items.map((message) => (
              <tr key={message.id} className="hover:bg-canvas">
                <td className="px-3 py-2 font-medium">{message.recipient}</td>
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
              ? `/email-delivery?page_token=${result.nextPageToken}`
              : null
          }
        />
      </Card>
    </>
  );
}
