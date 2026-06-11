import {
  EVENT_CSV_HEADERS,
  EVENT_NAMES,
  TIME_WINDOWS,
  eventToCsvRow,
  listEvents,
} from "@/lib/events";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const MAX_ROWS = 5000;

/** Download the filtered event log as CSV. Behind the studio session via middleware. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const window = TIME_WINDOWS[searchParams.get("time_window") ?? ""]
    ? searchParams.get("time_window")!
    : "24h";
  const en = searchParams.get("event_name") ?? "";
  const eventName = (EVENT_NAMES as readonly string[]).includes(en)
    ? en
    : undefined;

  let rows;
  try {
    const events = await listEvents({ eventName, window, limit: MAX_ROWS });
    rows = events.map(eventToCsvRow);
  } catch (err) {
    return new Response(`Events database not reachable: ${(err as Error).message}`, {
      status: 502,
    });
  }

  // ip / user_agent are attacker-influenced — neutralize spreadsheet formulas.
  const csv = toCsv([...EVENT_CSV_HEADERS], rows, { neutralizeFormulas: true });
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="events.csv"',
    },
  });
}
