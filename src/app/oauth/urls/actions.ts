"use server";

import { requireSession } from "@/lib/require-session";

import { saveHydraPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

const FIELDS = [
  "login",
  "registration",
  "consent",
  "logout",
  "post_logout_redirect",
  "error",
] as const;

export async function saveUrls(formData: FormData): Promise<void> {
  await requireSession();
  const patches = [];
  for (const field of FIELDS) {
    const value = String(formData.get(field) ?? "").trim();
    if (value && !/^https?:\/\//.test(value)) {
      flashRedirect("/oauth/urls", {
        ok: false,
        error: `${field} URL must start with http:// or https://`,
      });
    }
    patches.push({ path: ["urls", field], value: value || undefined });
  }
  const result = await saveHydraPatches(patches);
  flashRedirect("/oauth/urls", result);
}
