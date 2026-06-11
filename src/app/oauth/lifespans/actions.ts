"use server";

import { requireSession } from "@/lib/require-session";

import { saveHydraPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

const FIELDS = [
  { name: "login_consent", path: ["ttl", "login_consent_request"] },
  { name: "access_token", path: ["ttl", "access_token"] },
  { name: "refresh_token", path: ["ttl", "refresh_token"] },
  { name: "id_token", path: ["ttl", "id_token"] },
  { name: "auth_code", path: ["ttl", "auth_code"] },
] as const;

const DURATION = /^(\d+h)?(\d+m)?(\d+s)?$/;

export async function saveLifespans(formData: FormData): Promise<void> {
  await requireSession();
  const patches = [];
  for (const field of FIELDS) {
    const value = String(formData.get(field.name) ?? "").trim();
    if (value && !DURATION.test(value)) {
      flashRedirect("/oauth/lifespans", {
        ok: false,
        error: `Invalid duration for ${field.name}: "${value}" (use e.g. 1h, 30m, 720h)`,
      });
    }
    patches.push({ path: [...field.path], value: value || undefined });
  }
  const result = await saveHydraPatches(patches);
  flashRedirect("/oauth/lifespans", result);
}
