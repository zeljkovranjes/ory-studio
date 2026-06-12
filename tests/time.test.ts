import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "@/lib/time";

// Fixed reference point so the cases are deterministic.
const now = Date.parse("2026-06-11T12:00:00.000Z");
const ago = (ms: number) => new Date(now - ms).toISOString();

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("shows 'just now' for very recent and sub-45s times", () => {
    expect(formatRelativeTime(ago(0), now)).toBe("just now");
    expect(formatRelativeTime(ago(44 * SEC), now)).toBe("just now");
  });

  it("shows minutes, hours and days", () => {
    expect(formatRelativeTime(ago(5 * MIN), now)).toBe("5m ago");
    expect(formatRelativeTime(ago(59 * MIN), now)).toBe("59m ago");
    expect(formatRelativeTime(ago(2 * HOUR), now)).toBe("2h ago");
    expect(formatRelativeTime(ago(23 * HOUR), now)).toBe("23h ago");
    expect(formatRelativeTime(ago(3 * DAY), now)).toBe("3d ago");
    expect(formatRelativeTime(ago(29 * DAY), now)).toBe("29d ago");
  });

  it("falls back to a date for anything ~30 days or older", () => {
    const out = formatRelativeTime(ago(40 * DAY), now);
    expect(out).not.toMatch(/ago|just now/);
    expect(out).toBe(new Date(now - 40 * DAY).toLocaleDateString());
  });

  it("treats future timestamps (clock skew) as 'just now'", () => {
    expect(formatRelativeTime(new Date(now + 5 * MIN).toISOString(), now)).toBe(
      "just now",
    );
  });

  it("returns the raw input for an unparseable date", () => {
    expect(formatRelativeTime("not-a-date", now)).toBe("not-a-date");
  });
});
