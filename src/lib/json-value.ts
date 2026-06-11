/**
 * Parse a freeform JSON value used for identity metadata. Unlike traits,
 * Kratos metadata is arbitrary JSON (object, array, scalar, or null). An empty
 * or whitespace-only string means "clear it" and yields null.
 */
export function parseJsonValue(text: string): unknown {
  if (text.trim() === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Metadata must be valid JSON (or empty to clear)");
  }
}
