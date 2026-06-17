import { headers } from "next/headers";

/**
 * Whether to set the `Secure` flag on studio cookies.
 *
 * - `STUDIO_SECURE_COOKIES=true|false` forces it (set `true` in production).
 * - Otherwise it's auto-detected: secure when the request arrived over HTTPS
 *   (i.e. behind a TLS-terminating proxy that sets `x-forwarded-proto`), and
 *   not secure over plain HTTP (local dev) so the cookie still works there.
 *
 * This makes the session cookie `Secure` by default whenever TLS is present,
 * instead of silently shipping a non-Secure auth cookie if the operator forgets
 * to flip the flag.
 */
export async function secureCookies(): Promise<boolean> {
  const flag = process.env.STUDIO_SECURE_COOKIES;
  if (flag === "true") return true;
  if (flag === "false") return false;
  const proto = (await headers()).get("x-forwarded-proto");
  return proto?.split(",")[0].trim() === "https";
}
