"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "@/lib/constant-time";
import {
  SESSION_COOKIE,
  createSessionToken,
} from "@/lib/session";

export interface LoginState {
  error?: string;
}

function safeNext(next: string | undefined): string {
  // Only allow same-origin absolute paths to prevent open redirects.
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/identities";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = process.env.STUDIO_ADMIN_PASSWORD;
  const next = safeNext(String(formData.get("next") ?? ""));

  // If no password is configured the studio is open (local dev); just proceed.
  if (password) {
    const given = String(formData.get("password") ?? "");
    if (!timingSafeEqual(given, password)) {
      return { error: "Incorrect password." };
    }
  }

  const token = await createSessionToken(Math.floor(Date.now() / 1000));
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure: process.env.STUDIO_SECURE_COOKIES === "true",
  });
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
