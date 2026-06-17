"use server";

import { requireSession } from "@/lib/require-session";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveSmsConfig(formData: FormData): Promise<void> {
  await requireSession();
  const url = String(formData.get("url") ?? "").trim();
  if (url && !/^https?:\/\//.test(url)) {
    flashRedirect("/sms-configuration", {
      ok: false,
      error: "Endpoint URL must start with http:// or https://",
    });
  }
  const method = String(formData.get("method") ?? "POST");

  // Optional auth on the SMS provider's HTTP request.
  const authType = String(formData.get("auth_type") ?? "none");
  let auth: Record<string, unknown> | undefined;
  if (authType === "basic_auth") {
    auth = {
      type: "basic_auth",
      config: {
        user: String(formData.get("auth_user") ?? ""),
        password: String(formData.get("auth_password") ?? ""),
      },
    };
  } else if (authType === "api_key") {
    auth = {
      type: "api_key",
      config: {
        name: String(formData.get("auth_name") ?? ""),
        value: String(formData.get("auth_value") ?? ""),
        in: String(formData.get("auth_in") ?? "header") === "cookie"
          ? "cookie"
          : "header",
      },
    };
  }

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
            ...(auth ? { auth } : {}),
          },
        },
      ],
    },
  ]);
  flashRedirect("/sms-configuration", result);
}
