"use server";

import { redirect } from "next/navigation";
import { createIdentity } from "@/lib/kratos";
import { buildTraits } from "@/lib/identity-traits";
import { currentTenant } from "@/lib/tenant";

export interface CreateIdentityState {
  error?: string;
}

export async function createIdentityAction(
  _prev: CreateIdentityState,
  formData: FormData,
): Promise<CreateIdentityState> {
  const tenant = await currentTenant();
  let identityId: string;
  try {
    const traits = buildTraits({
      email: String(formData.get("email") ?? "").trim(),
      first: String(formData.get("first") ?? "").trim(),
      last: String(formData.get("last") ?? "").trim(),
      rawTraits: String(formData.get("raw_traits") ?? ""),
    });
    const identity = await createIdentity(tenant, {
      schemaId: String(formData.get("schema_id") ?? "default"),
      traits,
    });
    identityId = identity.id;
  } catch (err) {
    return { error: (err as Error).message };
  }
  redirect(`/identities/${identityId}`);
}
