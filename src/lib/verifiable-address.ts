/**
 * Validate a verifiable-address array index coming from form input. It is
 * interpolated into a JSON Patch path (`/verifiable_addresses/{index}/verified`),
 * so it must be a plain non-negative integer within bounds — never a string that
 * could smuggle extra path segments. Throws on anything else.
 */
export function parseAddressIndex(raw: string, count: number): number {
  if (!/^\d+$/.test(raw.trim())) {
    throw new Error("Invalid address index");
  }
  const index = Number(raw.trim());
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw new Error("Address index out of range");
  }
  return index;
}
