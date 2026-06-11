/**
 * Tenant registry for multi-tenant mode. Each tenant is one Ory instance the
 * studio can drive: a set of service endpoints plus the config paths / container
 * names the config engine reloads. Single mode never touches this — it uses the
 * implicit env-configured tenant.
 */

import { ensureOnce, getPool } from "./db";

export interface TenantRecord {
  id: string;
  slug: string;
  name: string;
  kratos_admin_url: string;
  kratos_public_url: string;
  hydra_admin_url: string | null;
  keto_read_url: string | null;
  keto_write_url: string | null;
  kratos_config_path: string | null;
  hydra_config_path: string | null;
  keto_namespaces_path: string | null;
  kratos_container: string | null;
  hydra_container: string | null;
  keto_container: string | null;
  created_at: string;
}

async function ensureSchema(): Promise<void> {
  return ensureOnce("tenants", async () => {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS studio_tenants (
        id BIGSERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        kratos_admin_url TEXT NOT NULL,
        kratos_public_url TEXT NOT NULL,
        hydra_admin_url TEXT,
        keto_read_url TEXT,
        keto_write_url TEXT,
        kratos_config_path TEXT,
        hydra_config_path TEXT,
        keto_namespaces_path TEXT,
        kratos_container TEXT,
        hydra_container TEXT,
        keto_container TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  });
}

const SELECT =
  "id::text, slug, name, kratos_admin_url, kratos_public_url, hydra_admin_url, keto_read_url, keto_write_url, kratos_config_path, hydra_config_path, keto_namespaces_path, kratos_container, hydra_container, keto_container, created_at::text";

export async function listTenants(): Promise<TenantRecord[]> {
  await ensureSchema();
  const res = await getPool().query<TenantRecord>(
    `SELECT ${SELECT} FROM studio_tenants ORDER BY name`,
  );
  return res.rows;
}

export async function getTenantBySlug(
  slug: string,
): Promise<TenantRecord | null> {
  await ensureSchema();
  const res = await getPool().query<TenantRecord>(
    `SELECT ${SELECT} FROM studio_tenants WHERE slug = $1`,
    [slug],
  );
  return res.rows[0] ?? null;
}

export interface TenantInput {
  slug: string;
  name: string;
  kratosAdminUrl: string;
  kratosPublicUrl: string;
  hydraAdminUrl?: string;
  ketoReadUrl?: string;
  ketoWriteUrl?: string;
  kratosConfigPath?: string;
  hydraConfigPath?: string;
  ketoNamespacesPath?: string;
  kratosContainer?: string;
  hydraContainer?: string;
  ketoContainer?: string;
}

const URL_RE = /^https?:\/\/.+/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

function validate(input: TenantInput): void {
  if (!SLUG_RE.test(input.slug)) {
    throw new Error("Slug must be lowercase letters, digits and hyphens");
  }
  if (!input.name.trim()) throw new Error("Name is required");
  for (const [label, value] of [
    ["Kratos admin URL", input.kratosAdminUrl],
    ["Kratos public URL", input.kratosPublicUrl],
  ] as const) {
    if (!URL_RE.test(value)) throw new Error(`${label} must be an http(s) URL`);
  }
  for (const [label, value] of [
    ["Hydra admin URL", input.hydraAdminUrl],
    ["Keto read URL", input.ketoReadUrl],
    ["Keto write URL", input.ketoWriteUrl],
  ] as const) {
    if (value && !URL_RE.test(value)) {
      throw new Error(`${label} must be an http(s) URL`);
    }
  }
}

export async function createTenant(input: TenantInput): Promise<void> {
  validate(input);
  await ensureSchema();
  await getPool().query(
    `INSERT INTO studio_tenants
      (slug, name, kratos_admin_url, kratos_public_url, hydra_admin_url,
       keto_read_url, keto_write_url, kratos_config_path, hydra_config_path,
       keto_namespaces_path, kratos_container, hydra_container, keto_container)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      input.slug,
      input.name.trim(),
      input.kratosAdminUrl,
      input.kratosPublicUrl,
      input.hydraAdminUrl || null,
      input.ketoReadUrl || null,
      input.ketoWriteUrl || null,
      input.kratosConfigPath || null,
      input.hydraConfigPath || null,
      input.ketoNamespacesPath || null,
      input.kratosContainer || null,
      input.hydraContainer || null,
      input.ketoContainer || null,
    ],
  );
}

export async function deleteTenant(slug: string): Promise<void> {
  await ensureSchema();
  await getPool().query(`DELETE FROM studio_tenants WHERE slug = $1`, [slug]);
}
