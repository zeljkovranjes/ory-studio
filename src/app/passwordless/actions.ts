"use server";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function savePasskeys(formData: FormData): Promise<void> {
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "methods", "passkey", "enabled"],
      value: formData.get("enabled") === "on",
    },
    {
      path: ["selfservice", "methods", "passkey", "config", "rp", "display_name"],
      value: String(formData.get("display_name") ?? "") || undefined,
    },
  ]);
  flashRedirect("/passwordless", result);
}

export async function saveOneTimeCode(formData: FormData): Promise<void> {
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "methods", "code", "passwordless_enabled"],
      value: formData.get("enabled") === "on",
    },
  ]);
  flashRedirect("/passwordless", result);
}

export async function saveWebauthnPasswordless(
  formData: FormData,
): Promise<void> {
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "methods", "webauthn", "enabled"],
      value: formData.get("enabled") === "on",
    },
    {
      path: ["selfservice", "methods", "webauthn", "config", "passwordless"],
      value: formData.get("enabled") === "on",
    },
    {
      path: ["selfservice", "methods", "webauthn", "config", "rp", "display_name"],
      value: String(formData.get("display_name") ?? "") || undefined,
    },
  ]);
  flashRedirect("/passwordless", result);
}
