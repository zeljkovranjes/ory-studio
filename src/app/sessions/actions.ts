"use server";

import { requireSession } from "@/lib/require-session";
import { disableSession } from "@/lib/kratos";
import { flashRedirect } from "@/lib/flash";
import { safeNextPath } from "@/lib/safe-next";
import { currentTenant } from "@/lib/tenant";

/**
 * Deactivate a single session. The caller passes `redirect_to` so the same
 * action serves both the global sessions list and an identity detail page;
 * it is validated through safeNextPath to prevent an open redirect.
 */
export async function revokeSessionAction(formData: FormData): Promise<void> {
  await requireSession();
  const sessionId = String(formData.get("session_id") ?? "");
  const back = safeNextPath(
    String(formData.get("redirect_to") ?? ""),
    "/sessions",
  );
  try {
    await disableSession(await currentTenant(), sessionId);
  } catch (err) {
    flashRedirect(back, { ok: false, error: (err as Error).message });
  }
  flashRedirect(back, { ok: true });
}
