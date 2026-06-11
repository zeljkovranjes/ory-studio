"use server";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveRedirects(formData: FormData): Promise<void> {
  const defaultUrl = String(formData.get("default_url") ?? "").trim();
  if (defaultUrl && !/^https?:\/\//.test(defaultUrl)) {
    flashRedirect("/browser-redirects", {
      ok: false,
      error: "The global redirect URL must start with http:// or https://",
    });
  }
  const allowed = String(formData.get("allowed_urls") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const url of allowed) {
    if (!/^https?:\/\//.test(url)) {
      flashRedirect("/browser-redirects", {
        ok: false,
        error: `Allowed URL must be fully qualified (http/https): ${url}`,
      });
    }
  }
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "default_browser_return_url"],
      value: defaultUrl || undefined,
    },
    { path: ["selfservice", "allowed_return_urls"], value: allowed },
  ]);
  flashRedirect("/browser-redirects", result);
}
