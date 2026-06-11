"use server";

import { redirect } from "next/navigation";
import {
  createRecoveryCode,
  deleteIdentity,
  revokeIdentitySessions,
  type RecoveryCodeResult,
} from "@/lib/kratos";
import { flashRedirect } from "@/lib/flash";
import { currentTenant } from "@/lib/tenant";

export async function deleteIdentityAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  try {
    await deleteIdentity(await currentTenant(), id);
  } catch (err) {
    flashRedirect(`/identities/${encodeURIComponent(id)}`, {
      ok: false,
      error: (err as Error).message,
    });
  }
  redirect("/identities");
}

export async function revokeSessionsAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const page = `/identities/${encodeURIComponent(id)}`;
  try {
    await revokeIdentitySessions(await currentTenant(), id);
  } catch (err) {
    flashRedirect(page, { ok: false, error: (err as Error).message });
  }
  flashRedirect(page, { ok: true });
}

export interface RecoveryCodeState {
  result?: RecoveryCodeResult;
  error?: string;
}

export async function recoveryCodeAction(
  _prev: RecoveryCodeState,
  formData: FormData,
): Promise<RecoveryCodeState> {
  try {
    const result = await createRecoveryCode(
      await currentTenant(),
      String(formData.get("id") ?? ""),
    );
    return { result };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
