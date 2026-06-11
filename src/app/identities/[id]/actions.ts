"use server";

import { requireSession } from "@/lib/require-session";

import { redirect } from "next/navigation";
import {
  createRecoveryCode,
  deleteIdentity,
  getIdentity,
  revokeIdentitySessions,
  setAddressVerified,
  setIdentityState,
  updateIdentityMetadata,
  updateIdentityTraits,
  type RecoveryCodeResult,
} from "@/lib/kratos";
import { parseTraitsObject } from "@/lib/identity-traits";
import { parseJsonValue } from "@/lib/json-value";
import { parseAddressIndex } from "@/lib/verifiable-address";
import { flashRedirect } from "@/lib/flash";
import { currentTenant } from "@/lib/tenant";

export async function deleteIdentityAction(formData: FormData): Promise<void> {
  await requireSession();
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
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const page = `/identities/${encodeURIComponent(id)}`;
  try {
    await revokeIdentitySessions(await currentTenant(), id);
  } catch (err) {
    flashRedirect(page, { ok: false, error: (err as Error).message });
  }
  flashRedirect(page, { ok: true });
}

export async function setIdentityStateAction(
  formData: FormData,
): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const state = formData.get("state") === "inactive" ? "inactive" : "active";
  const page = `/identities/${encodeURIComponent(id)}`;
  try {
    await setIdentityState(await currentTenant(), id, state);
  } catch (err) {
    flashRedirect(page, { ok: false, error: (err as Error).message });
  }
  flashRedirect(page, {
    ok: true,
    warning:
      state === "inactive"
        ? "Identity deactivated — the user can no longer sign in."
        : undefined,
  });
}

export interface EditTraitsState {
  error?: string;
}

export async function updateTraitsAction(
  _prev: EditTraitsState,
  formData: FormData,
): Promise<EditTraitsState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  let traits;
  try {
    traits = parseTraitsObject(String(formData.get("traits") ?? ""));
  } catch (err) {
    return { error: (err as Error).message };
  }
  try {
    await updateIdentityTraits(await currentTenant(), id, traits);
  } catch (err) {
    return { error: (err as Error).message };
  }
  flashRedirect(`/identities/${encodeURIComponent(id)}`, { ok: true });
}

export async function setAddressVerifiedAction(
  formData: FormData,
): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const verified = formData.get("verified") === "true";
  const page = `/identities/${encodeURIComponent(id)}`;
  const tenant = await currentTenant();
  try {
    // Bound the index against the identity's actual address count so it can
    // never smuggle extra segments into the JSON Patch path.
    const identity = await getIdentity(tenant, id);
    const index = parseAddressIndex(
      String(formData.get("index") ?? ""),
      identity.verifiable_addresses?.length ?? 0,
    );
    await setAddressVerified(tenant, id, index, verified);
  } catch (err) {
    flashRedirect(page, { ok: false, error: (err as Error).message });
  }
  flashRedirect(page, { ok: true });
}

export interface EditMetadataState {
  error?: string;
}

export async function updateMetadataAction(
  _prev: EditMetadataState,
  formData: FormData,
): Promise<EditMetadataState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const field =
    formData.get("field") === "metadata_public"
      ? "metadata_public"
      : "metadata_admin";
  let value;
  try {
    value = parseJsonValue(String(formData.get("value") ?? ""));
  } catch (err) {
    return { error: (err as Error).message };
  }
  try {
    await updateIdentityMetadata(await currentTenant(), id, field, value);
  } catch (err) {
    return { error: (err as Error).message };
  }
  flashRedirect(`/identities/${encodeURIComponent(id)}`, { ok: true });
}

export interface RecoveryCodeState {
  result?: RecoveryCodeResult;
  error?: string;
}

export async function recoveryCodeAction(
  _prev: RecoveryCodeState,
  formData: FormData,
): Promise<RecoveryCodeState> {
  await requireSession();
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
