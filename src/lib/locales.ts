/**
 * Localization overrides, scoped to the active tenant. Each locale holds a flat
 * map of message-key → string. Stored in the studio DB and exposed as JSON so a
 * custom account-experience UI can load the overrides. (The bundled hosted UI
 * ships English; consuming these requires Ory Elements i18n wiring.)
 */

import { ensureOnce, getPool } from "./db";

export interface LocaleOverride {
  locale: string;
  messages: Record<string, string>;
}

async function ensureSchema(): Promise<void> {
  return ensureOnce("locales", async () => {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS studio_locales (
        tenant_id TEXT NOT NULL DEFAULT 'default',
        locale TEXT NOT NULL,
        messages JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (tenant_id, locale)
      );
    `);
  });
}

const LOCALE_RE = /^[a-z]{2}(-[A-Za-z0-9]{2,8})?$/;

/** Parse + validate a JSON object of string→string message overrides. */
export function parseMessages(raw: string): Record<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Messages must be valid JSON");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Messages must be a JSON object");
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string") {
      throw new Error(`Message "${key}" must be a string`);
    }
    out[key] = value;
  }
  return out;
}

export function isValidLocale(locale: string): boolean {
  return LOCALE_RE.test(locale);
}

export async function listLocales(tenantId: string): Promise<LocaleOverride[]> {
  await ensureSchema();
  const res = await getPool().query<LocaleOverride>(
    `SELECT locale, messages FROM studio_locales WHERE tenant_id = $1 ORDER BY locale`,
    [tenantId],
  );
  return res.rows;
}

export async function getLocale(
  tenantId: string,
  locale: string,
): Promise<Record<string, string> | null> {
  await ensureSchema();
  const res = await getPool().query<{ messages: Record<string, string> }>(
    `SELECT messages FROM studio_locales WHERE tenant_id = $1 AND locale = $2`,
    [tenantId, locale],
  );
  return res.rows[0]?.messages ?? null;
}

export async function saveLocale(
  tenantId: string,
  locale: string,
  messages: Record<string, string>,
): Promise<void> {
  if (!isValidLocale(locale)) {
    throw new Error(`Invalid locale "${locale}" (use e.g. en, es, pt-BR)`);
  }
  await ensureSchema();
  await getPool().query(
    `INSERT INTO studio_locales (tenant_id, locale, messages, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (tenant_id, locale)
     DO UPDATE SET messages = EXCLUDED.messages, updated_at = now()`,
    [tenantId, locale, JSON.stringify(messages)],
  );
}

export async function deleteLocale(
  tenantId: string,
  locale: string,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `DELETE FROM studio_locales WHERE tenant_id = $1 AND locale = $2`,
    [tenantId, locale],
  );
}
