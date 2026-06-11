"use server";

import { saveHydraPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveStrategies(formData: FormData): Promise<void> {
  const scope = String(formData.get("scope") ?? "wildcard");
  const accessToken = String(formData.get("access_token") ?? "opaque");
  const jwtScopeClaim = String(formData.get("jwt_scope_claim") ?? "list");
  const result = await saveHydraPatches([
    {
      path: ["strategies", "scope"],
      value: ["wildcard", "exact"].includes(scope) ? scope : "wildcard",
    },
    {
      path: ["strategies", "access_token"],
      value: ["opaque", "jwt"].includes(accessToken) ? accessToken : "opaque",
    },
    {
      path: ["strategies", "jwt", "scope_claim"],
      value: ["list", "string", "both"].includes(jwtScopeClaim)
        ? jwtScopeClaim
        : "list",
    },
  ]);
  flashRedirect("/oauth/strategies", result);
}
