/**
 * SHA-256 to lowercase hex via Web Crypto, so it runs in both Edge and Node.
 * Used to reduce secrets to a fixed-length digest before a constant-time
 * compare, removing any length-based timing oracle on the raw secret.
 */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
