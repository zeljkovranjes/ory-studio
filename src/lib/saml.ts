/**
 * SAML connections — a registry of SAML identity providers, scoped to the
 * active tenant. Each connection is surfaced to Kratos as an OIDC provider; the
 * studio stores the connection metadata here. Ungated (unlike Ory Network,
 * where SAML is Enterprise-only).
 */

import { ensureOnce, getPool } from "./db";

export const SSO_PROTOCOLS = ["saml", "oidc"] as const;
export type SsoProtocol = (typeof SSO_PROTOCOLS)[number];

export interface SamlConnection {
  id: string;
  tenant_id: string;
  org_id: string | null;
  protocol: SsoProtocol;
  name: string;
  idp_metadata_url: string | null;
  idp_entity_id: string | null;
  oidc_issuer_url: string | null;
  oidc_client_id: string | null;
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
      -- additive columns so existing rows keep working
      ALTER TABLE studio_saml_connections ADD COLUMN IF NOT EXISTS org_id TEXT;
      ALTER TABLE studio_saml_connections ADD COLUMN IF NOT EXISTS protocol TEXT NOT NULL DEFAULT 'saml';
      ALTER TABLE studio_saml_connections ADD COLUMN IF NOT EXISTS oidc_issuer_url TEXT;
      ALTER TABLE studio_saml_connections ADD COLUMN IF NOT EXISTS oidc_client_id TEXT;
      ALTER TABLE studio_saml_connections ADD COLUMN IF NOT EXISTS oidc_client_secret TEXT;
      CREATE INDEX IF NOT EXISTS studio_saml_tenant
        ON studio_saml_connections (tenant_id);
      CREATE INDEX IF NOT EXISTS studio_saml_org
        ON studio_saml_connections (tenant_id, org_id);
    `);
  });
}

const SELECT =
  "id::text, tenant_id, org_id, protocol, name, idp_metadata_url, idp_entity_id, oidc_issuer_url, oidc_client_id, enabled, created_at::text";

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

export interface ConnectionInput {
  protocol: SsoProtocol;
  name: string;
  orgId?: string;
  // SAML
  idpMetadataUrl?: string;
  idpEntityId?: string;
  // OIDC
  oidcIssuerUrl?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
}

/** Pure validation for an SSO connection (SAML or OIDC). Throws on first problem. */
export function validateConnectionInput(input: ConnectionInput): void {
  if (!(SSO_PROTOCOLS as readonly string[]).includes(input.protocol)) {
    throw new Error("Unknown SSO protocol");
  }
  if (!input.name.trim()) throw new Error("Connection name is required");
  if (input.protocol === "saml") {
    if (input.idpMetadataUrl && !/^https?:\/\/.+/.test(input.idpMetadataUrl)) {
      throw new Error("IdP metadata URL must be an http(s) URL");
    }
    if (!input.idpMetadataUrl && !input.idpEntityId) {
      throw new Error("Provide an IdP metadata URL or an entity ID");
    }
  } else {
    if (!/^https?:\/\/.+/.test(input.oidcIssuerUrl ?? "")) {
      throw new Error("OIDC connections require an https issuer URL");
    }
    if (!input.oidcClientId?.trim()) {
      throw new Error("OIDC connections require a client ID");
    }
  }
}

/** Back-compat: SAML-only creation used by the global SAML page. */
export function validateSamlInput(input: {
  name: string;
  idpMetadataUrl: string;
  idpEntityId: string;
}): void {
  validateConnectionInput({ protocol: "saml", ...input });
}

export async function createConnection(
  tenantId: string,
  input: ConnectionInput,
): Promise<void> {
  validateConnectionInput(input);
  await ensureSchema();
  await getPool().query(
    `INSERT INTO studio_saml_connections
       (tenant_id, org_id, protocol, name, idp_metadata_url, idp_entity_id,
        oidc_issuer_url, oidc_client_id, oidc_client_secret)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      tenantId,
      input.orgId || null,
      input.protocol,
      input.name.trim(),
      input.idpMetadataUrl || null,
      input.idpEntityId || null,
      input.oidcIssuerUrl || null,
      input.oidcClientId || null,
      input.oidcClientSecret || null,
    ],
  );
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
  return createConnection(tenantId, { protocol: "saml", ...input });
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
