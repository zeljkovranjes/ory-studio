import { describe, expect, it } from "vitest";
import { EVENT_CSV_HEADERS, eventToCsvRow, type StudioEvent } from "@/lib/events";
import { toCsv } from "@/lib/csv";

const baseEvent: StudioEvent = {
  id: "1",
  ts: "2026-06-11T10:00:00.000Z",
  service: "kratos",
  event_name: "login",
  identity_id: "abc-123",
  ip: "203.0.113.7",
  user_agent: "Mozilla/5.0",
  geo_country: "US",
  payload: { method: "password" },
};

describe("eventToCsvRow", () => {
  it("maps an event to a row matching the headers, in order", () => {
    const row = eventToCsvRow(baseEvent);
    expect(row).toHaveLength(EVENT_CSV_HEADERS.length);
    expect(row).toEqual([
      "2026-06-11T10:00:00.000Z",
      "login",
      "abc-123",
      "password",
      "203.0.113.7",
      "US",
      "Mozilla/5.0",
    ]);
  });

  it("renders null for missing optional fields and payload method", () => {
    const row = eventToCsvRow({
      ...baseEvent,
      identity_id: null,
      ip: null,
      geo_country: null,
      user_agent: null,
      payload: null,
    });
    expect(row).toEqual([
      "2026-06-11T10:00:00.000Z",
      "login",
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("round-trips into a CSV document with the headers", () => {
    const csv = toCsv([...EVENT_CSV_HEADERS], [eventToCsvRow(baseEvent)]);
    expect(csv.split("\r\n")[0]).toBe(
      "timestamp,event,identity_id,method,ip,country,user_agent",
    );
    expect(csv).toContain("203.0.113.7");
  });
});
