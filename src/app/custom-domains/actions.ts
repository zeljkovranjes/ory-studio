"use server";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveDomain(formData: FormData): Promise<void> {
  const baseUrl = String(formData.get("base_url") ?? "").trim();
  if (baseUrl && !/^https?:\/\//.test(baseUrl)) {
    flashRedirect("/custom-domains", {
      ok: false,
      error: "Public base URL must start with http:// or https://",
    });
  }
  const cookieDomain = String(formData.get("cookie_domain") ?? "").trim();
  if (cookieDomain && !/^[a-zA-Z0-9.-]+$/.test(cookieDomain)) {
    flashRedirect("/custom-domains", {
      ok: false,
      error: "Cookie domain must be a bare hostname (e.g. example.com)",
    });
  }
  const result = await saveKratosPatches([
    {
      path: ["serve", "public", "base_url"],
      value: baseUrl || undefined,
    },
    {
      path: ["cookies", "domain"],
      value: cookieDomain || undefined,
    },
  ]);
  flashRedirect("/custom-domains", result);
}
