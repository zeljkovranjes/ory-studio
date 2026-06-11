/**
 * Validate a post-login `next` redirect target. Only same-origin absolute paths
 * are allowed, defending against open redirects:
 *  - must start with a single `/`
 *  - rejects protocol-relative `//host` and backslash-normalized `/\host`
 *    (browsers normalize `\` to `/`, so `/\evil.com` resolves off-origin)
 *  - rejects control characters and space, which browsers may strip or
 *    normalize, turning a seemingly-safe path into an off-origin redirect
 */
export function safeNextPath(
  next: string | undefined,
  fallback = "/identities",
): string {
  if (!next || !next.startsWith("/")) return fallback;
  if (next.length >= 2 && (next[1] === "/" || next[1] === "\\")) return fallback;
  for (let i = 0; i < next.length; i++) {
    // Reject anything at or below space (0x20) and DEL (0x7f): CR, LF, Tab, etc.
    const code = next.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) return fallback;
  }
  return next;
}
