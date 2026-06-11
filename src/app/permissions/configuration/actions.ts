"use server";

import { requireSession } from "@/lib/require-session";

import { saveKetoNamespaces } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

export async function saveNamespaces(formData: FormData): Promise<void> {
  await requireSession();
  const content = String(formData.get("opl") ?? "");
  const result = await saveKetoNamespaces(content);
  flashRedirect("/permissions/configuration", result);
}
