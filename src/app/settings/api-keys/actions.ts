"use server";

import { revalidatePath } from "next/cache";
import { createApiKey, revokeApiKey } from "@/lib/api-keys";
import { currentTenant } from "@/lib/tenant";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/settings/api-keys";

export interface CreateKeyState {
  token?: string;
  prefix?: string;
  error?: string;
}

/** useActionState-compatible: returns the plaintext token once on success. */
export async function createKeyAction(
  _prev: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const tenant = await currentTenant();
  try {
    const { token, prefix } = await createApiKey(
      tenant.id,
      String(formData.get("name") ?? ""),
    );
    revalidatePath(PAGE);
    return { token, prefix };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function revokeKeyAction(formData: FormData): Promise<void> {
  const tenant = await currentTenant();
  try {
    await revokeApiKey(tenant.id, String(formData.get("id") ?? ""));
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}
