"use server";

import { saveHydraPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/oauth/configure";

export async function saveIssuer(formData: FormData): Promise<void> {
  const issuer = String(formData.get("issuer") ?? "").trim();
  if (issuer && !/^https?:\/\//.test(issuer)) {
    flashRedirect(PAGE, {
      ok: false,
      error: "Issuer URL must start with http:// or https://",
    });
  }
  const result = await saveHydraPatches([
    { path: ["urls", "self", "issuer"], value: issuer || undefined },
  ]);
  flashRedirect(PAGE, result);
}

export async function savePkce(formData: FormData): Promise<void> {
  const result = await saveHydraPatches([
    {
      path: ["oauth2", "pkce", "enforced"],
      value: formData.get("enforced") === "on",
    },
    {
      path: ["oauth2", "pkce", "enforced_for_public_clients"],
      value: formData.get("enforced_public") === "on",
    },
  ]);
  flashRedirect(PAGE, result);
}

export async function saveClaims(formData: FormData): Promise<void> {
  const allowed = String(formData.get("allowed_claims") ?? "")
    .split(/[\s,]+/)
    .map((claim) => claim.trim())
    .filter(Boolean);
  const result = await saveHydraPatches([
    {
      path: ["oauth2", "allowed_top_level_claims"],
      value: allowed,
    },
    {
      path: ["oauth2", "mirror_top_level_claims"],
      value: formData.get("mirror") === "on",
    },
  ]);
  flashRedirect(PAGE, result);
}

export async function saveRefreshGrant(formData: FormData): Promise<void> {
  const grace = String(formData.get("grace_period") ?? "").trim();
  if (grace && !/^(\d+h)?(\d+m)?(\d+s)?$/.test(grace)) {
    flashRedirect(PAGE, {
      ok: false,
      error: `Invalid grace period: "${grace}" (use e.g. 30s, 5m)`,
    });
  }
  const result = await saveHydraPatches([
    {
      path: ["oauth2", "grant", "refresh_token", "rotation_grace_period"],
      value: grace || undefined,
    },
  ]);
  flashRedirect(PAGE, result);
}
