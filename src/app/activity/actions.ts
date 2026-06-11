"use server";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";
import { readKratosRaw } from "@/lib/kratos-config";
import { buildSystemHookPatches } from "@/lib/system-hooks";

export async function enableCapture(): Promise<void> {
  const config = await readKratosRaw();
  if ("error" in config) {
    flashRedirect("/activity", { ok: false, error: String(config.error) });
  }
  const baseUrl =
    process.env.STUDIO_INTERNAL_URL ?? "http://studio:3000";
  const token = process.env.STUDIO_COLLECTOR_TOKEN;
  if (!token) {
    flashRedirect("/activity", {
      ok: false,
      error:
        "STUDIO_COLLECTOR_TOKEN is not set — configure it before enabling capture.",
    });
  }
  const patches = buildSystemHookPatches(config, baseUrl, token!);
  if (patches.length === 0) {
    flashRedirect("/activity", {
      ok: true,
      warning: "Activity capture hooks are already installed.",
    });
  }
  const result = await saveKratosPatches(patches);
  flashRedirect("/activity", result);
}
