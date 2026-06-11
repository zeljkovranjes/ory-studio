"use server";

import { requireSession } from "@/lib/require-session";

import { saveHydraPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveCookies(formData: FormData): Promise<void> {
  await requireSession();
  const sameSite = String(formData.get("same_site") ?? "Lax");
  const result = await saveHydraPatches([
    {
      path: ["serve", "cookies", "same_site_mode"],
      value: ["Lax", "Strict", "None"].includes(sameSite) ? sameSite : "Lax",
    },
    {
      path: ["serve", "cookies", "same_site_legacy_workaround"],
      value: formData.get("legacy_workaround") === "on",
    },
  ]);
  flashRedirect("/oauth/cookies", result);
}
