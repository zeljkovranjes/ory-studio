"use server";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveSmsConfig(formData: FormData): Promise<void> {
  const url = String(formData.get("url") ?? "").trim();
  if (url && !/^https?:\/\//.test(url)) {
    flashRedirect("/sms-configuration", {
      ok: false,
      error: "Endpoint URL must start with http:// or https://",
    });
  }
  const method = String(formData.get("method") ?? "POST");
  const result = await saveKratosPatches([
    {
      path: ["courier", "channels"],
      value: [
        {
          id: "sms",
          type: "http",
          request_config: {
            url,
            method: ["GET", "POST", "PUT", "PATCH"].includes(method)
              ? method
              : "POST",
            body: "base64://e30=", // empty jsonnet payload template; customize per provider
          },
        },
      ],
    },
  ]);
  flashRedirect("/sms-configuration", result);
}
