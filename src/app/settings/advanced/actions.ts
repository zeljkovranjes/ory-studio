"use server";

import { requireSession } from "@/lib/require-session";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveAdvanced(formData: FormData): Promise<void> {
  await requireSession();
  const level = String(formData.get("log_level") ?? "info");
  const result = await saveKratosPatches([
    {
      path: ["log", "level"],
      value: ["trace", "debug", "info", "warning", "error"].includes(level)
        ? level
        : "info",
    },
    {
      path: ["selfservice", "flows", "registration", "enable_legacy_one_step"],
      value: formData.get("one_step") === "on" ? true : undefined,
    },
  ]);
  flashRedirect("/settings/advanced", result);
}
