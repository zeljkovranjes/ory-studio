/**
 * Validate the sessions "active" filter from the query string into the boolean
 * Kratos expects (`?active=true|false`), or undefined for "all". Keeps an
 * arbitrary query value from being forwarded to the admin API.
 */
export function parseActiveFilter(value: string | undefined): boolean | undefined {
  if (value === "active") return true;
  if (value === "inactive") return false;
  return undefined;
}
