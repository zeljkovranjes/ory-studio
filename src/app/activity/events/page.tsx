import { EVENT_NAMES, listEvents, TIME_WINDOWS } from "@/lib/events";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Table,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ event_name?: string; time_window?: string }>;
}) {
  const { event_name, time_window } = await searchParams;
  const window = TIME_WINDOWS[time_window ?? ""] ? time_window! : "24h";
  const eventName = (EVENT_NAMES as readonly string[]).includes(
    event_name ?? "",
  )
    ? event_name
    : undefined;

  let events: Awaited<ReturnType<typeof listEvents>> = [];
  let dbError: string | null = null;
  try {
    events = await listEvents({ eventName, window });
  } catch (err) {
    dbError = (err as Error).message;
  }

  return (
    <>
      <PageHeader
        title="Logs & events"
        description="The event log captured by the analytics webhooks. Filter by event name and time window."
      />

      <Card>
        <form className="mb-4 flex flex-wrap items-end gap-3" action="/activity/events">
          <label className="text-sm">
            <span className="font-medium">Event</span>
            <select
              name="event_name"
              defaultValue={eventName ?? ""}
              className="mt-1 block h-8 w-48 rounded border border-border bg-surface px-2 text-sm text-input-text focus:border-accent focus:outline-none"
            >
              <option value="">All events</option>
              {EVENT_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium">Time window</span>
            <select
              name="time_window"
              defaultValue={window}
              className="mt-1 block h-8 w-40 rounded border border-border bg-surface px-2 text-sm text-input-text focus:border-accent focus:outline-none"
            >
              {Object.keys(TIME_WINDOWS).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-8 rounded bg-accent px-3 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
          >
            Filter
          </button>
        </form>

        {dbError ? (
          <EmptyState
            message={`Events database not reachable (${dbError}).`}
          />
        ) : events.length === 0 ? (
          <EmptyState message="No events in this window." />
        ) : (
          <Table headers={["Event", "Identity", "Method", "IP", "Timestamp"]}>
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-canvas">
                <td className="px-3 py-2">
                  <Badge tone="muted">{event.event_name}</Badge>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-fg-muted">
                  {event.identity_id ?? "—"}
                </td>
                <td className="px-3 py-2 text-fg-muted">
                  {(event.payload as { method?: string } | null)?.method ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-fg-muted">
                  {event.ip ?? "—"}
                </td>
                <td className="px-3 py-2 text-fg-muted">
                  {new Date(event.ts).toLocaleString()}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
