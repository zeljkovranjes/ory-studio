/**
 * Coarse, offline IP classification. Full country/city resolution needs a
 * licensed MaxMind GeoLite2 database (see SECURITY.md / docs) — until that's
 * mounted, we at least distinguish local-network traffic so the Session
 * location panel is meaningful in development. No external calls (no SSRF).
 */

function isPrivateV4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true; // loopback
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // link-local
  return false;
}

/**
 * Returns a coarse location label for an IP, or null when it can't be
 * classified (e.g. a routable public address that needs a geo DB to resolve).
 */
export function classifyIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const addr = ip.trim();
  if (addr === "::1" || addr.startsWith("::ffff:127.")) return "Local network";
  if (addr.startsWith("fc") || addr.startsWith("fd")) return "Local network"; // ULA
  if (addr.startsWith("fe80")) return "Local network"; // link-local v6
  if (isPrivateV4(addr)) return "Local network";
  return null;
}
