"use server";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

const FLOWS = [
  "login",
  "registration",
  "settings",
  "verification",
  "recovery",
  "error",
] as const;

export async function saveUiUrls(formData: FormData): Promise<void> {
  const patches = [];
  for (const flow of FLOWS) {
    const value = String(formData.get(flow) ?? "").trim();
    if (value && !/^https?:\/\//.test(value)) {
      flashRedirect("/ui", {
        ok: false,
        error: `${flow} UI URL must start with http:// or https://`,
      });
    }
    if (!value) continue; // keep the existing value when left empty
    patches.push({
      path: ["selfservice", "flows", flow, "ui_url"],
      value,
    });
  }
  const result = await saveKratosPatches(patches);
  flashRedirect("/ui", result);
}
