"use server";

import { requireSession } from "@/lib/require-session";

import {
  buildCourierPatches,
  saveEmailTemplate,
} from "@/lib/email-templates";
import { saveKratosPatches } from "@/lib/config-engine";
import { currentTenant } from "@/lib/tenant";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/email-templates";

export async function saveEmailTemplateAction(
  formData: FormData,
): Promise<void> {
  await requireSession();
  const tenant = await currentTenant();
  const templateType = String(formData.get("template_type") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const body = String(formData.get("body") ?? "");

  try {
    await saveEmailTemplate(tenant.id, { templateType, subject, body });
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }

  // Propagate to Kratos courier config and reload.
  const result = await saveKratosPatches(
    buildCourierPatches(templateType, subject, body),
  );
  flashRedirect(PAGE, result);
}
