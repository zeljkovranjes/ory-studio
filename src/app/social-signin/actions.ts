"use server";

import { requireSession } from "@/lib/require-session";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";
import { readKratosRaw } from "@/lib/kratos-config";
import {
  PROVIDERS_PATH,
  removeProvider,
  upsertProvider,
} from "@/lib/kratos-social";

export async function saveOidcGeneral(formData: FormData): Promise<void> {
  await requireSession();
  const baseRedirectUri = String(formData.get("base_redirect_uri") ?? "").trim();
  if (baseRedirectUri && !/^https?:\/\//.test(baseRedirectUri)) {
    flashRedirect("/social-signin", {
      ok: false,
      error: "Base redirect URI must start with http:// or https://",
    });
  }
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "methods", "oidc", "enabled"],
      value: formData.get("enabled") === "on",
    },
    {
      path: ["selfservice", "methods", "oidc", "config", "base_redirect_uri"],
      value: baseRedirectUri || undefined,
    },
  ]);
  flashRedirect("/social-signin", result);
}

export async function upsertOidcProvider(formData: FormData): Promise<void> {
  await requireSession();
  const config = await readKratosRaw();
  if ("error" in config) {
    flashRedirect("/social-signin", { ok: false, error: String(config.error) });
  }
  const isEdit = formData.get("is_edit") === "true";
  let providers;
  try {
    providers = upsertProvider(
      config,
      {
        id: String(formData.get("id") ?? "").trim(),
        provider: String(formData.get("provider") ?? ""),
        clientId: String(formData.get("client_id") ?? "").trim(),
        clientSecret: String(formData.get("client_secret") ?? ""),
        label: String(formData.get("label") ?? ""),
        issuerUrl: String(formData.get("issuer_url") ?? ""),
        scope: String(formData.get("scope") ?? ""),
        microsoftTenant: String(formData.get("microsoft_tenant") ?? ""),
        subjectSource: String(formData.get("subject_source") ?? ""),
        appleTeamId: String(formData.get("apple_team_id") ?? ""),
        applePrivateKeyId: String(formData.get("apple_private_key_id") ?? ""),
      },
      { isEdit },
    );
  } catch (err) {
    flashRedirect("/social-signin", {
      ok: false,
      error: (err as Error).message,
    });
  }
  const result = await saveKratosPatches([
    { path: PROVIDERS_PATH, value: providers },
  ]);
  flashRedirect("/social-signin", result);
}

export async function deleteOidcProvider(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const config = await readKratosRaw();
  if ("error" in config) {
    flashRedirect("/social-signin", { ok: false, error: String(config.error) });
  }
  const result = await saveKratosPatches([
    { path: PROVIDERS_PATH, value: removeProvider(config, id) },
  ]);
  flashRedirect("/social-signin", result);
}
