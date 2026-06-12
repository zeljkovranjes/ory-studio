/**
 * Compact relative-time formatting ("just now", "5m ago", "2h ago", "3d ago").
 * Falls back to a localized date for anything older than ~30 days. `nowMs` is
 * passed in so the result is deterministic and testable.
 */
export function formatRelativeTime(iso: string, nowMs: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;

  const diffMs = nowMs - then;
  // Future timestamps (clock skew) read as "just now" rather than negatives.
  if (diffMs < 0) return "just now";

  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "just now";

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;

  return new Date(then).toLocaleDateString();
}
