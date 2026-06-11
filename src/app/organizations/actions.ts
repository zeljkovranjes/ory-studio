"use server";

import { requireSession } from "@/lib/require-session";

import {
  createOrganization,
  deleteOrganization,
  parseDomains,
} from "@/lib/organizations";
import { currentTenant } from "@/lib/tenant";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/organizations";

export async function createOrgAction(formData: FormData): Promise<void> {
  await requireSession();
  const tenant = await currentTenant();
  try {
    await createOrganization(tenant.id, {
      name: String(formData.get("name") ?? "").trim(),
      domains: parseDomains(String(formData.get("domains") ?? "")),
    });
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}

export async function deleteOrgAction(formData: FormData): Promise<void> {
  await requireSession();
  const tenant = await currentTenant();
  try {
    await deleteOrganization(tenant.id, String(formData.get("id") ?? ""));
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}
