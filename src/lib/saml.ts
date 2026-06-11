/**
 * SAML connections — a Polis-style registry of SAML identity providers, scoped
 * to the active tenant. Ory Polis bridges SAML to OIDC, so each connection is
 * surfaced to Kratos as an OIDC provider; the studio stores the connection
 * metadata here. Ungated (unlike Ory Network, where SAML is Enterprise-only).
 */

import { ensureOnce, getPool } from "./db";

export interface SamlConnection {
  id: string;
  tenant_id: string;
  org_id: string | null;
  name: string;
  idp_metadata_url: string | null;
  idp_entity_id: string | null;
  enabled: boolean;
  created_at: string;
}

async function ensureSchema(): Promise<void> {
  return ensureOnce("saml", async () => {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS studio_saml_connections (
        id BIGSERIAL PRIMARY KEY,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        name TEXT NOT NULL,
        idp_metadata_url TEXT,
        idp_entity_id TEXT,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      -- org scoping added later; additive so existing rows keep working
      ALTER TABLE studio_saml_connections ADD COLUMN IF NOT EXISTS org_id TEXT;
      CREATE INDEX IF NOT EXISTS studio_saml_tenant
        ON studio_saml_connections (tenant_id);
      CREATE INDEX IF NOT EXISTS studio_saml_org
        ON studio_saml_connections (tenant_id, org_id);
    `);
  });
}

const SELECT =
  "id::text, tenant_id, org_id, name, idp_metadata_url, idp_entity_id, enabled, created_at::text";

export async function listSamlConnections(
  tenantId: string,
): Promise<SamlConnection[]> {
  await ensureSchema();
  const res = await getPool().query<SamlConnection>(
    `SELECT ${SELECT} FROM studio_saml_connections WHERE tenant_id = $1 ORDER BY name`,
    [tenantId],
  );
  return res.rows;
}

/** SAML connections scoped to a specific organization. */
export async function listSamlConnectionsForOrg(
  tenantId: string,
  orgId: string,
): Promise<SamlConnection[]> {
  await ensureSchema();
  const res = await getPool().query<SamlConnection>(
    `SELECT ${SELECT} FROM studio_saml_connections
     WHERE tenant_id = $1 AND org_id = $2 ORDER BY name`,
    [tenantId, orgId],
  );
  return res.rows;
}

/** Pure validation for a SAML connection, throwing on the first problem. */
export function validateSamlInput(input: {
  name: string;
  idpMetadataUrl: string;
  idpEntityId: string;
}): void {
  if (!input.name.trim()) throw new Error("Connection name is required");
  if (input.idpMetadataUrl && !/^https?:\/\/.+/.test(input.idpMetadataUrl)) {
    throw new Error("IdP metadata URL must be an http(s) URL");
  }
  if (!input.idpMetadataUrl && !input.idpEntityId) {
    throw new Error("Provide an IdP metadata URL or an entity ID");
  }
}

export async function createSamlConnection(
  tenantId: string,
  input: {
    name: string;
    idpMetadataUrl: string;
    idpEntityId: string;
    orgId?: string;
  },
): Promise<void> {
  validateSamlInput(input);
  await ensureSchema();
  await getPool().query(
    `INSERT INTO studio_saml_connections (tenant_id, org_id, name, idp_metadata_url, idp_entity_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      tenantId,
      input.orgId || null,
      input.name.trim(),
      input.idpMetadataUrl || null,
      input.idpEntityId || null,
    ],
  );
}

export async function setSamlEnabled(
  tenantId: string,
  id: string,
  enabled: boolean,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE studio_saml_connections SET enabled = $3 WHERE tenant_id = $1 AND id = $2::bigint`,
    [tenantId, id, enabled],
  );
}

export async function deleteSamlConnection(
  tenantId: string,
  id: string,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `DELETE FROM studio_saml_connections WHERE tenant_id = $1 AND id = $2::bigint`,
    [tenantId, id],
  );
}
