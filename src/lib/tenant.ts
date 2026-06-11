/**
 * Tenancy layer. Single-tenant by default; multi-tenant is a config toggle
 * (`TENANCY_MODE=multi`). Every data-plane call goes through `currentTenant()`
 * and every config-engine write through `currentTenantConfig()`, so the rest of
 * the app is tenancy-agnostic.
 *
 * - single: one implicit tenant whose endpoints + config paths come from env.
 * - multi : the active tenant is chosen by the `studio_tenant` cookie and looked
 *           up in the `studio_tenants` registry; falls back to the first tenant.
 */

import { cookies } from "next/headers";
import { getTenantBySlug, listTenants, type TenantRecord } from "./tenants";

export interface TenantServices {
  kratosAdminUrl: string;
  kratosPublicUrl: string;
  hydraAdminUrl?: string;
  ketoReadUrl?: string;
  ketoWriteUrl?: string;
}

export interface TenantConfig {
  kratosConfigPath: string;
  hydraConfigPath: string;
  ketoNamespacesPath: string;
  kratosContainer: string;
  hydraContainer: string;
  ketoContainer: string;
}

export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  services: TenantServices;
}

export type TenancyMode = "single" | "multi";

export const TENANT_COOKIE = "studio_tenant";
export const DEFAULT_TENANT_ID = "default";

export function tenancyMode(): TenancyMode {
  return process.env.TENANCY_MODE === "multi" ? "multi" : "single";
}

function envServices(): TenantServices {
  return {
    kratosAdminUrl: process.env.ORY_KRATOS_ADMIN_URL ?? "http://localhost:4434",
    kratosPublicUrl: process.env.ORY_KRATOS_PUBLIC_URL ?? "http://localhost:4433",
    hydraAdminUrl: process.env.ORY_HYDRA_ADMIN_URL,
    ketoReadUrl: process.env.ORY_KETO_READ_URL,
    ketoWriteUrl: process.env.ORY_KETO_WRITE_URL,
  };
}

function envConfig(): TenantConfig {
  return {
    kratosConfigPath:
      process.env.KRATOS_CONFIG_PATH ?? "./config/kratos/kratos.yml",
    hydraConfigPath: process.env.HYDRA_CONFIG_PATH ?? "./config/hydra/hydra.yml",
    ketoNamespacesPath:
      process.env.KETO_NAMESPACES_PATH ?? "./config/keto/namespaces.keto.ts",
    kratosContainer: "kratos",
    hydraContainer: "hydra",
    ketoContainer: "keto",
  };
}

function recordToContext(t: TenantRecord): TenantContext {
  return {
    id: t.slug,
    slug: t.slug,
    name: t.name,
    services: {
      kratosAdminUrl: t.kratos_admin_url,
      kratosPublicUrl: t.kratos_public_url,
      hydraAdminUrl: t.hydra_admin_url ?? undefined,
      ketoReadUrl: t.keto_read_url ?? undefined,
      ketoWriteUrl: t.keto_write_url ?? undefined,
    },
  };
}

function recordToConfig(t: TenantRecord): TenantConfig {
  const env = envConfig();
  return {
    kratosConfigPath: t.kratos_config_path ?? env.kratosConfigPath,
    hydraConfigPath: t.hydra_config_path ?? env.hydraConfigPath,
    ketoNamespacesPath: t.keto_namespaces_path ?? env.ketoNamespacesPath,
    kratosContainer: t.kratos_container ?? env.kratosContainer,
    hydraContainer: t.hydra_container ?? env.hydraContainer,
    ketoContainer: t.keto_container ?? env.ketoContainer,
  };
}

/** Resolve the active tenant record in multi mode (cookie → first), or null. */
async function activeRecord(): Promise<TenantRecord | null> {
  const store = await cookies();
  const slug = store.get(TENANT_COOKIE)?.value;
  if (slug) {
    const byCookie = await getTenantBySlug(slug);
    if (byCookie) return byCookie;
  }
  const all = await listTenants();
  return all[0] ?? null;
}

/** The active tenant's service endpoints. */
export async function currentTenant(): Promise<TenantContext> {
  if (tenancyMode() === "multi") {
    const record = await activeRecord();
    if (record) return recordToContext(record);
    // No tenants registered yet — fall back to the env instance so the studio
    // is still usable while tenants are being added.
  }
  return {
    id: DEFAULT_TENANT_ID,
    slug: DEFAULT_TENANT_ID,
    name: "default",
    services: envServices(),
  };
}

/** The active tenant's config paths + container names for the config engine. */
export async function currentTenantConfig(): Promise<TenantConfig> {
  if (tenancyMode() === "multi") {
    const record = await activeRecord();
    if (record) return recordToConfig(record);
  }
  return envConfig();
}
