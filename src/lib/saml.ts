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
      CREATE INDEX IF NOT EXISTS studio_saml_tenant
        ON studio_saml_connections (tenant_id);
    `);
  });
}

export async function listSamlConnections(
  tenantId: string,
): Promise<SamlConnection[]> {
  await ensureSchema();
  const res = await getPool().query<SamlConnection>(
    `SELECT id::text, tenant_id, name, idp_metadata_url, idp_entity_id, enabled, created_at::text
     FROM studio_saml_connections WHERE tenant_id = $1 ORDER BY name`,
    [tenantId],
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
  input: { name: string; idpMetadataUrl: string; idpEntityId: string },
): Promise<void> {
  validateSamlInput(input);
  await ensureSchema();
  await getPool().query(
    `INSERT INTO studio_saml_connections (tenant_id, name, idp_metadata_url, idp_entity_id)
     VALUES ($1, $2, $3, $4)`,
    [
      tenantId,
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
