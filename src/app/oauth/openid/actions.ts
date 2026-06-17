"use server";

import { requireSession } from "@/lib/require-session";

import { saveHydraPatches, type YamlPatch } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/oauth/openid";

function list(formData: FormData, name: string): string[] {
  return String(formData.get(name) ?? "")
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// Discovery URL overrides under webfinger.oidc_discovery. Empty clears the
// override so Hydra falls back to the issuer-derived default.
const WEBFINGER_URL_FIELDS: [string, string][] = [
  ["jwks_url", "JWKS URL"],
  ["token_url", "Token URL"],
  ["auth_url", "Auth URL"],
  ["userinfo_url", "Userinfo URL"],
  ["client_registration_url", "Client Registration URL"],
];

export async function saveWebfinger(formData: FormData): Promise<void> {
  await requireSession();
  const patches: YamlPatch[] = [
    {
      path: ["webfinger", "oidc_discovery", "supported_claims"],
      value: list(formData, "supported_claims"),
    },
    {
      path: ["webfinger", "oidc_discovery", "supported_scope"],
      value: list(formData, "supported_scope"),
    },
  ];
  for (const [key, label] of WEBFINGER_URL_FIELDS) {
    const url = String(formData.get(key) ?? "").trim();
    if (url && !/^https?:\/\//.test(url)) {
      flashRedirect(PAGE, {
        ok: false,
        error: `${label} must start with http:// or https://`,
      });
    }
    patches.push({
      path: ["webfinger", "oidc_discovery", key],
      value: url || undefined,
    });
  }
  flashRedirect(PAGE, await saveHydraPatches(patches));
}

export async function saveSubjectIdentifiers(
  formData: FormData,
): Promise<void> {
  await requireSession();
  const types = formData.getAll("types").map(String);
  const valid = types.filter((type) => ["public", "pairwise"].includes(type));
  if (valid.length === 0) {
    flashRedirect(PAGE, {
      ok: false,
      error: "Select at least one subject identifier type",
    });
  }
  const salt = String(formData.get("pairwise_salt") ?? "").trim();
  if (valid.includes("pairwise") && salt.length < 8) {
    flashRedirect(PAGE, {
      ok: false,
      error: "Pairwise identifiers require a salt of at least 8 characters",
    });
  }
  const result = await saveHydraPatches([
    {
      path: ["oidc", "subject_identifiers", "supported_types"],
      value: valid,
    },
    {
      path: ["oidc", "subject_identifiers", "pairwise", "salt"],
      value: valid.includes("pairwise") ? salt : undefined,
    },
  ]);
  flashRedirect(PAGE, result);
}

export async function saveDynamicRegistration(
  formData: FormData,
): Promise<void> {
  await requireSession();
  const result = await saveHydraPatches([
    {
      path: ["oidc", "dynamic_client_registration", "enabled"],
      value: formData.get("enabled") === "on",
    },
    {
      path: ["oidc", "dynamic_client_registration", "default_scope"],
      value: list(formData, "default_scope"),
    },
  ]);
  flashRedirect(PAGE, result);
}
