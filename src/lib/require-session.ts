/**
 * Per-action auth guard.
 *
 * The Edge middleware gates page navigations, but Next.js server actions are
 * dispatched by a global action id carried in the `Next-Action` header and run
 * regardless of which route received the POST. Any route exempt from the
 * middleware matcher (e.g. `/login`) is therefore an unauthenticated dispatch
 * surface for *every* registered action. Next's own guidance is to treat server
 * actions as public HTTP endpoints and authenticate inside each one.
 *
 * Every mutating server action calls `await requireSession()` as its first
 * statement. The login action is the sole exception — it is the authentication
 * entry point and must run while unauthenticated.
 */

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "UnauthorizedError";
  }
}

export async function requireSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!(await verifySessionToken(token, nowSeconds))) {
    throw new UnauthorizedError();
  }
}
