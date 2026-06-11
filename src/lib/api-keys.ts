/**
 * Studio API keys, scoped to the active tenant. Tokens authenticate the event
 * collector (alongside the env STUDIO_COLLECTOR_TOKEN) and any future studio
 * API. Only a SHA-256 hash is stored — the plaintext is shown once on creation.
 */

import crypto from "crypto";
import { ensureOnce, getPool } from "./db";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
}

async function ensureSchema(): Promise<void> {
  return ensureOnce("api-keys", async () => {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS studio_api_keys (
        id BIGSERIAL PRIMARY KEY,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        prefix TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_used_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS studio_api_keys_tenant
        ON studio_api_keys (tenant_id);
    `);
  });
}

function generateToken(): string {
  return `osk_${crypto.randomBytes(24).toString("base64url")}`;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function listApiKeys(tenantId: string): Promise<ApiKey[]> {
  await ensureSchema();
  const res = await getPool().query<ApiKey>(
    `SELECT id::text, name, prefix, created_at::text, last_used_at::text
     FROM studio_api_keys WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId],
  );
  return res.rows;
}

/** Create a key; returns the plaintext token (shown once) and its prefix. */
export async function createApiKey(
  tenantId: string,
  name: string,
): Promise<{ token: string; prefix: string }> {
  if (!name.trim()) throw new Error("Key name is required");
  await ensureSchema();
  const token = generateToken();
  const prefix = token.slice(0, 12);
  await getPool().query(
    `INSERT INTO studio_api_keys (tenant_id, name, token_hash, prefix)
     VALUES ($1, $2, $3, $4)`,
    [tenantId, name.trim(), hashToken(token), prefix],
  );
  return { token, prefix };
}

export async function revokeApiKey(
  tenantId: string,
  id: string,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `DELETE FROM studio_api_keys WHERE tenant_id = $1 AND id = $2::bigint`,
    [tenantId, id],
  );
}

/**
 * Verify a presented token against stored hashes (any tenant). Updates
 * last_used_at on a hit. Returns whether the token is a valid studio key.
 */
export async function verifyApiKey(token: string): Promise<boolean> {
  if (!token.startsWith("osk_")) return false;
  await ensureSchema();
  const res = await getPool().query<{ id: string }>(
    `UPDATE studio_api_keys SET last_used_at = now()
     WHERE token_hash = $1 RETURNING id::text`,
    [hashToken(token)],
  );
  return res.rowCount === 1;
}
