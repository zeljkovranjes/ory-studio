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

// Hash to a fixed-length digest before the constant-time compare so the
// comparison time can't leak the admin password's length.
async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
    const [givenHash, expectedHash] = await Promise.all([
      sha256Hex(given),
      sha256Hex(password),
    ]);
    if (!timingSafeEqual(givenHash, expectedHash)) {
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
