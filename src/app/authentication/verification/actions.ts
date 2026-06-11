"use server";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveVerification(formData: FormData): Promise<void> {
  const use = String(formData.get("use") ?? "code");
  const result = await saveKratosPatches([
    {
      path: ["selfservice", "flows", "verification", "enabled"],
      value: formData.get("enabled") === "on",
    },
    {
      path: ["selfservice", "flows", "verification", "use"],
      value: ["code", "link"].includes(use) ? use : "code",
    },
    {
      path: [
        "selfservice",
        "flows",
        "verification",
        "notify_unknown_recipients",
      ],
      value: formData.get("notify_unknown") === "on",
    },
  ]);
  flashRedirect("/authentication/verification", result);
}
