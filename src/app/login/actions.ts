"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "@/lib/constant-time";
import { sha256Hex } from "@/lib/hash";
import { safeNextPath } from "@/lib/safe-next";
import { secureCookies } from "@/lib/cookies";
import {
  SESSION_COOKIE,
  createSessionToken,
  studioOpenMode,
} from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = process.env.STUDIO_ADMIN_PASSWORD;
  const next = safeNextPath(String(formData.get("next") ?? ""));

  // If no password is configured the studio is open (local dev); just proceed.
  if (!studioOpenMode()) {
    // Fail closed: a missing admin password locks the studio rather than
    // opening it (open mode must be opted into via STUDIO_DEV_OPEN=true).
    if (!password) {
      return {
        error:
          "Studio is not configured. Set STUDIO_ADMIN_PASSWORD (or STUDIO_DEV_OPEN=true for local dev).",
      };
    }
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
    secure: await secureCookies(),
  });
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
