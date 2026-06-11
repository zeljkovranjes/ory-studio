import { listEventStreams } from "@/lib/event-streams";
import { currentTenant } from "@/lib/tenant";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
} from "@/components/ui";
import { Flash, SaveButton, SelectField, TextField } from "@/components/forms";
import {
  createStreamAction,
  deleteStreamAction,
  toggleStreamAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function EventStreamsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const tenant = await currentTenant();

  let streams: Awaited<ReturnType<typeof listEventStreams>> = [];
  let dbError: string | null = null;
  try {
    streams = await listEventStreams(tenant.id);
  } catch (err) {
    dbError = (err as Error).message;
  }

  return (
    <>
      <PageHeader
        title="Event streams"
        description="Stream captured identity events to an HTTPS endpoint or AWS SNS topic — build dashboards, alerting, and audit pipelines. The studio fans out events to enabled HTTPS streams as they're collected."
      />
      <Flash {...flash} />

      <Card title="Streams">
        {dbError ? (
          <ErrorState message={`Event stream store unavailable: ${dbError}`} />
        ) : streams.length === 0 ? (
          <EmptyState message="No event streams yet. Add one below." />
        ) : (
          <Table headers={["Name", "Type", "Destination", "Status", ""]}>
            {streams.map((s) => (
              <tr key={s.id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 uppercase text-fg-muted">{s.type}</td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {s.url}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={s.enabled ? "success" : "muted"}>
                    {s.enabled ? "enabled" : "disabled"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <form action={toggleStreamAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input
                        type="hidden"
                        name="enabled"
                        value={(!s.enabled).toString()}
                      />
                      <button
                        type="submit"
                        className="text-sm text-accent hover:underline"
                      >
                        {s.enabled ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <form action={deleteStreamAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-sm text-error hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card
        title="Add event stream"
        description="HTTPS streams receive a POST with the event payload as JSON. SNS streams require an AWS SNS topic ARN."
      >
        <form action={createStreamAction} className="max-w-xl">
          <TextField name="name" label="Name" placeholder="Audit pipeline" />
          <SelectField
            name="type"
            label="Type"
            defaultValue="https"
            options={[
              { value: "https", label: "HTTPS endpoint" },
              { value: "sns", label: "AWS SNS topic" },
            ]}
          />
          <TextField
            name="url"
            label="Destination"
            description="https:// URL for HTTPS, or arn:aws:sns:… for SNS"
            placeholder="https://example.com/events"
            mono
            wide
          />
          <SaveButton label="Add stream" />
        </form>
      </Card>
    </>
  );
}
