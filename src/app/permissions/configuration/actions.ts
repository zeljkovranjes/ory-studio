"use server";

import { saveKetoNamespaces } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveNamespaces(formData: FormData): Promise<void> {
  const content = String(formData.get("opl") ?? "");
  const result = await saveKetoNamespaces(content);
  flashRedirect("/permissions/configuration", result);
}
