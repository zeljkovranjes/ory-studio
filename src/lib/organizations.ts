/**
 * Organizations — B2B groupings scoped to the active tenant. Stored in the
 * studio DB; membership and per-org SSO connections build on top of these.
 * Ungated (unlike Ory Network, where this is an Enterprise feature).
 */

import { ensureOnce, getPool } from "./db";

export interface Organization {
  id: string;
  tenant_id: string;
  name: string;
  domains: string[];
  created_at: string;
}

async function ensureSchema(): Promise<void> {
  return ensureOnce("organizations", async () => {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS studio_organizations (
        id BIGSERIAL PRIMARY KEY,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        name TEXT NOT NULL,
        domains TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS studio_organizations_tenant
        ON studio_organizations (tenant_id);
    `);
  });
}

export async function listOrganizations(
  tenantId: string,
): Promise<Organization[]> {
  await ensureSchema();
  const res = await getPool().query<Organization>(
    `SELECT id::text, tenant_id, name, domains, created_at::text
     FROM studio_organizations WHERE tenant_id = $1 ORDER BY name`,
    [tenantId],
  );
  return res.rows;
}

const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

/** Pure validation for an organization, throwing on the first problem. */
export function validateOrganizationInput(input: {
  name: string;
  domains: string[];
}): void {
  if (!input.name.trim()) throw new Error("Organization name is required");
  for (const d of input.domains) {
    if (!DOMAIN_RE.test(d)) throw new Error(`Invalid domain: ${d}`);
  }
}

export async function createOrganization(
  tenantId: string,
  input: { name: string; domains: string[] },
): Promise<void> {
  validateOrganizationInput(input);
  await ensureSchema();
  await getPool().query(
    `INSERT INTO studio_organizations (tenant_id, name, domains)
     VALUES ($1, $2, $3)`,
    [tenantId, input.name.trim(), input.domains],
  );
}

export async function deleteOrganization(
  tenantId: string,
  id: string,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `DELETE FROM studio_organizations WHERE tenant_id = $1 AND id = $2::bigint`,
    [tenantId, id],
  );
}

/** Parse a textarea/CSV of domains into a clean list. */
export function parseDomains(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}
