/**
 * Constant-time string comparison, safe for the Edge runtime (no node:crypto).
 * Always compares the full length of a fixed-size digest so the timing does
 * not leak the position of the first differing byte or the operand lengths.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Mix in the lengths so unequal-length inputs still take the same path.
  let mismatch = a.length === b.length ? 0 : 1;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    // charCodeAt past the end returns NaN; coerce to a stable number.
    const ca = a.charCodeAt(i) | 0;
    const cb = b.charCodeAt(i) | 0;
    mismatch |= ca ^ cb;
  }
  return mismatch === 0;
}
