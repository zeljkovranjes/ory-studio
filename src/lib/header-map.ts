/**
 * Parse/format a newline-delimited `Key: Value` list into a header map, used
 * for custom SMTP headers (Kratos `courier.smtp.headers`). Blank lines are
 * ignored; the first colon separates name from value.
 */
export function parseHeaderMap(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const i = line.indexOf(":");
    if (i === -1) continue;
    const name = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (name) map[name] = value;
  }
  return map;
}

export function formatHeaderMap(map: unknown): string {
  if (!map || typeof map !== "object") return "";
  return Object.entries(map as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
}
