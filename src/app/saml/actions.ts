"use server";

import {
  createSamlConnection,
  deleteSamlConnection,
  setSamlEnabled,
} from "@/lib/saml";
import { currentTenant } from "@/lib/tenant";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/saml";

export async function createSamlAction(formData: FormData): Promise<void> {
  const tenant = await currentTenant();
  try {
    await createSamlConnection(tenant.id, {
      name: String(formData.get("name") ?? "").trim(),
      idpMetadataUrl: String(formData.get("idp_metadata_url") ?? "").trim(),
      idpEntityId: String(formData.get("idp_entity_id") ?? "").trim(),
    });
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}

export async function toggleSamlAction(formData: FormData): Promise<void> {
  const tenant = await currentTenant();
  try {
    await setSamlEnabled(
      tenant.id,
      String(formData.get("id") ?? ""),
      formData.get("enabled") === "true",
    );
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}

export async function deleteSamlAction(formData: FormData): Promise<void> {
  const tenant = await currentTenant();
  try {
    await deleteSamlConnection(tenant.id, String(formData.get("id") ?? ""));
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}
