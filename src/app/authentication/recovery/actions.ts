"use server";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveRecovery(formData: FormData): Promise<void> {
  const use = String(formData.get("use") ?? "code");
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "flows", "recovery", "enabled"],
      value: formData.get("enabled") === "on",
    },
    {
      path: ["selfservice", "flows", "recovery", "use"],
      value: ["code", "link"].includes(use) ? use : "code",
    },
    {
      path: ["selfservice", "flows", "recovery", "notify_unknown_recipients"],
      value: formData.get("notify_unknown") === "on",
    },
  ]);
  flashRedirect("/authentication/recovery", result);
}
