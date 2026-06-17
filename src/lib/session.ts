/**
 * Signed session tokens for studio login. HMAC-SHA256 over an expiry stamp,
 * using Web Crypto so it runs in both the Edge middleware and Node route
 * handlers. The studio is single-admin, so the token carries no identity —
 * only "authenticated until <exp>".
 */

import { timingSafeEqual } from "./constant-time";

export const SESSION_COOKIE = "studio_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return bytesToBase64Url(sig);
}

/**
 * Whether a real signing secret is configured. If neither STUDIO_SESSION_SECRET
 * nor STUDIO_ADMIN_PASSWORD is set, there is NO secret — and a derived value of
 * `"derived:"` would be a publicly-known constant, lettings anyone forge a
 * session cookie. So in that state no token may be considered valid.
 */
function hasConfiguredSecret(): boolean {
  return Boolean(
    process.env.STUDIO_SESSION_SECRET || process.env.STUDIO_ADMIN_PASSWORD,
  );
}

/**
 * Session signing secret. Prefers STUDIO_SESSION_SECRET; otherwise derives a
 * stable secret from the admin password so tokens survive restarts without
 * extra config. Only meaningful when hasConfiguredSecret() is true.
 */
export function sessionSecret(): string {
  return (
    process.env.STUDIO_SESSION_SECRET ||
    `derived:${process.env.STUDIO_ADMIN_PASSWORD ?? ""}`
  );
}

/**
 * "Open" (no-login) mode for local dev. It MUST be opted into explicitly with
 * STUDIO_DEV_OPEN=true — never inferred from a blank STUDIO_ADMIN_PASSWORD, so a
 * misconfigured deploy (empty password) fails CLOSED rather than exposing an
 * admin console that wields the Docker socket.
 */
export function studioOpenMode(): boolean {
  return process.env.STUDIO_DEV_OPEN === "true";
}

export async function createSessionToken(nowSeconds: number): Promise<string> {
  const exp = nowSeconds + SESSION_TTL_SECONDS;
  const payload = String(exp);
  const sig = await hmac(sessionSecret(), payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined,
  nowSeconds: number,
): Promise<boolean> {
  if (!token) return false;
  // No real signing secret → the deploy is locked; no token (forged with the
  // constant "derived:" fallback or otherwise) may be accepted.
  if (!hasConfiguredSecret()) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(sessionSecret(), payload);
  if (!timingSafeEqual(sig, expected)) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && exp > nowSeconds;
}
