"use server";

import { requireSession } from "@/lib/require-session";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveGeneralMfa(formData: FormData): Promise<void> {
  await requireSession();
  const result = await saveKratosPatches([
    {
      path: ["session", "whoami", "required_aal"],
      value: formData.get("login_aal") === "on" ? "highest_available" : "aal1",
    },
    {
      path: ["selfservice", "flows", "settings", "required_aal"],
      value:
        formData.get("settings_aal") === "on" ? "highest_available" : "aal1",
    },
  ]);
  flashRedirect("/mfa", result);
}

export async function saveCodeMfa(formData: FormData): Promise<void> {
  await requireSession();
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "methods", "code", "mfa_enabled"],
      value: formData.get("enabled") === "on",
    },
  ]);
  flashRedirect("/mfa", result);
}

export async function saveTotp(formData: FormData): Promise<void> {
  await requireSession();
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "methods", "totp", "enabled"],
      value: formData.get("enabled") === "on",
    },
    {
      path: ["selfservice", "methods", "totp", "config", "issuer"],
      value: String(formData.get("issuer") ?? "") || undefined,
    },
  ]);
  flashRedirect("/mfa", result);
}

export async function saveWebauthnMfa(formData: FormData): Promise<void> {
  await requireSession();
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "methods", "webauthn", "enabled"],
      value: formData.get("enabled") === "on",
    },
    {
      path: ["selfservice", "methods", "webauthn", "config", "rp", "display_name"],
      value: String(formData.get("display_name") ?? "") || undefined,
    },
    {
      path: ["selfservice", "methods", "webauthn", "config", "rp", "id"],
      value: String(formData.get("rp_id") ?? "") || undefined,
    },
  ]);
  flashRedirect("/mfa", result);
}

export async function saveLookupSecrets(formData: FormData): Promise<void> {
  await requireSession();
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "methods", "lookup_secret", "enabled"],
      value: formData.get("enabled") === "on",
    },
  ]);
  flashRedirect("/mfa", result);
}
