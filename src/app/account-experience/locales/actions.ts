"use server";

import { requireSession } from "@/lib/require-session";

import {
  deleteLocale,
  parseMessages,
  saveLocale,
} from "@/lib/locales";
import { currentTenant } from "@/lib/tenant";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/account-experience/locales";

export async function saveLocaleAction(formData: FormData): Promise<void> {
  await requireSession();
  const tenant = await currentTenant();
  const locale = String(formData.get("locale") ?? "").trim();
  try {
    const messages = parseMessages(String(formData.get("messages") ?? "{}"));
    await saveLocale(tenant.id, locale, messages);
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}

export async function deleteLocaleAction(formData: FormData): Promise<void> {
  await requireSession();
  const tenant = await currentTenant();
  try {
    await deleteLocale(tenant.id, String(formData.get("locale") ?? ""));
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}
