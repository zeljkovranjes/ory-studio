"use server";

import { requireSession } from "@/lib/require-session";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createTenant, deleteTenant } from "@/lib/tenants";
import { TENANT_COOKIE } from "@/lib/tenant";
import { secureCookies } from "@/lib/cookies";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/settings/tenants";

export async function createTenantAction(formData: FormData): Promise<void> {
  await requireSession();
  try {
    await createTenant({
      slug: String(formData.get("slug") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      kratosAdminUrl: String(formData.get("kratos_admin_url") ?? "").trim(),
      kratosPublicUrl: String(formData.get("kratos_public_url") ?? "").trim(),
      hydraAdminUrl: String(formData.get("hydra_admin_url") ?? "").trim(),
      ketoReadUrl: String(formData.get("keto_read_url") ?? "").trim(),
      ketoWriteUrl: String(formData.get("keto_write_url") ?? "").trim(),
      kratosConfigPath: String(formData.get("kratos_config_path") ?? "").trim(),
      hydraConfigPath: String(formData.get("hydra_config_path") ?? "").trim(),
      ketoNamespacesPath: String(
        formData.get("keto_namespaces_path") ?? "",
      ).trim(),
      kratosContainer: String(formData.get("kratos_container") ?? "").trim(),
      hydraContainer: String(formData.get("hydra_container") ?? "").trim(),
      ketoContainer: String(formData.get("keto_container") ?? "").trim(),
    });
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}

export async function deleteTenantAction(formData: FormData): Promise<void> {
  await requireSession();
  try {
    await deleteTenant(String(formData.get("slug") ?? ""));
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}

/** Switch the active tenant (sets the selector cookie) and reload. */
export async function switchTenantAction(formData: FormData): Promise<void> {
  await requireSession();
  const slug = String(formData.get("slug") ?? "");
  const store = await cookies();
  store.set(TENANT_COOKIE, slug, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: await secureCookies(),
  });
  redirect("/identities");
}
