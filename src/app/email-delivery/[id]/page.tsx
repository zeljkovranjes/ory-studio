import Link from "next/link";
import { getCourierMessage } from "@/lib/kratos";
import { currentTenant } from "@/lib/tenant";
import {
  Badge,
  Card,
  ErrorState,
  PageHeader,
  RelativeTime,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  sent: "success",
  queued: "muted",
  processing: "muted",
  abandoned: "error",
} as const;

export default async function CourierMessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await currentTenant();

  let message;
  try {
    message = await getCourierMessage(tenant, id);
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
        title={message.subject || "(no subject)"}
        description={`Message ${message.id}`}
      />
      <div className="mb-4">
        <Link
          href="/email-delivery"
          className="text-sm text-fg-muted hover:text-accent"
        >
          ← Back to message delivery
        </Link>
      </div>

      <Card title="Details">
        <dl className="grid max-w-2xl grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-fg-muted">Recipient</dt>
          <dd className="font-medium">{message.recipient}</dd>
          <dt className="text-fg-muted">Channel</dt>
          <dd>{message.type}</dd>
          <dt className="text-fg-muted">Template</dt>
          <dd>{message.template_type}</dd>
          <dt className="text-fg-muted">Status</dt>
          <dd>
            <Badge tone={STATUS_TONE[message.status] ?? "muted"}>
              {message.status}
            </Badge>
          </dd>
          <dt className="text-fg-muted">Created</dt>
          <dd>
            <RelativeTime iso={message.created_at} />
          </dd>
        </dl>
      </Card>

      <Card title="Body">
        {/* Rendered as plain text — never as HTML — so message content can't
            inject markup into the studio. */}
        <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-canvas p-3 font-mono text-xs">
          {message.body ?? "(no body recorded)"}
        </pre>
      </Card>
    </>
  );
}
