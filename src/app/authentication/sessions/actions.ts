"use server";

import { isValidDuration, saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveSessionSettings(formData: FormData): Promise<void> {
  const lifespan = String(formData.get("lifespan") ?? "");
  const privilegedAge = String(formData.get("privileged_age") ?? "");
  for (const [label, value] of [
    ["Session lifespan", lifespan],
    ["Privileged session age", privilegedAge],
  ] as const) {
    if (!isValidDuration(value)) {
      flashRedirect("/authentication/sessions", {
        ok: false,
        error: `${label}: "${value}" is not a valid duration (use e.g. 72h, 1h30m, 15m)`,
      });
    }
  }
  const sameSite = String(formData.get("same_site") ?? "Lax");
  const result = await saveKratosPatches([
    { path: ["session", "lifespan"], value: lifespan },
    {
      path: ["selfservice", "flows", "settings", "privileged_session_max_age"],
      value: privilegedAge,
    },
    {
      path: ["session", "cookie", "same_site"],
      value: ["Lax", "Strict", "None"].includes(sameSite) ? sameSite : "Lax",
    },
    {
      path: ["session", "cookie", "persistent"],
      value: formData.get("persistent") === "on",
    },
  ]);
  flashRedirect("/authentication/sessions", result);
}
