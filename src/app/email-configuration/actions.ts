"use server";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveEmailConfig(formData: FormData): Promise<void> {
  const connectionUri = String(formData.get("connection_uri") ?? "").trim();
  if (
    connectionUri &&
    !/^smtps?:\/\//.test(connectionUri)
  ) {
    flashRedirect("/email-configuration", {
      ok: false,
      error: "Connection URI must start with smtp:// or smtps://",
    });
  }
  const result = await saveKratosPatches([
    {
      path: ["courier", "smtp", "connection_uri"],
      value: connectionUri || undefined,
    },
    {
      path: ["courier", "smtp", "from_address"],
      value: String(formData.get("from_address") ?? "") || undefined,
    },
    {
      path: ["courier", "smtp", "from_name"],
      value: String(formData.get("from_name") ?? "") || undefined,
    },
  ]);
  flashRedirect("/email-configuration", result);
}
