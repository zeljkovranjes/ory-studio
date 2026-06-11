import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Studio access control via a signed session cookie. Unauthenticated requests
 * are redirected to /login (no credentials in the URL, so server actions work).
 * If STUDIO_ADMIN_PASSWORD is unset, the studio is open (local dev only).
 */
export async function middleware(request: NextRequest) {
  const password = process.env.STUDIO_ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const ok = await verifySessionToken(token, Math.floor(Date.now() / 1000));
  if (ok) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const here = request.nextUrl.pathname + request.nextUrl.search;
  if (here && here !== "/") loginUrl.searchParams.set("next", here);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Protect everything except Next.js internals, static assets, the login
  // page, the webhook collector (own token), and the public brand theme CSS.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/internal/events|account-experience/theme\\.css).*)",
  ],
};
