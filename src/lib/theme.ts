/**
 * Account-experience theme tokens, scoped to the active tenant. Mirrors Ory's
 * --ory-theme-* brand tokens. Stored in the studio DB; the Branding editor sets
 * and previews them. Propagating them to the hosted account-experience UI uses
 * Ory Elements theming (documented in the editor).
 */

import { ensureOnce, getPool } from "./db";

export interface ThemeTokens {
  accent: string;
  accentEmphasis: string;
  accentSubtle: string;
  foreground: string;
  surface: string;
  border: string;
  error: string;
}

export const DEFAULT_THEME: ThemeTokens = {
  accent: "#3d53f5",
  accentEmphasis: "#3142c4",
  accentSubtle: "#eceefe",
  foreground: "#171717",
  surface: "#ffffff",
  border: "#eeeeee",
  error: "#df1642",
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Render theme tokens as the --ory-theme-* CSS custom properties that Ory
 * Elements (the account-experience UI) reads. Only valid hex tokens are emitted.
 */
export function themeToCss(tokens: ThemeTokens): string {
  const vars: [string, string][] = [
    ["--ory-theme-accent-def", tokens.accent],
    ["--ory-theme-accent-emphasis", tokens.accentEmphasis],
    ["--ory-theme-accent-subtle", tokens.accentSubtle],
    ["--ory-theme-foreground-def", tokens.foreground],
    ["--ory-theme-background-surface", tokens.surface],
    ["--ory-theme-border-def", tokens.border],
    ["--ory-theme-error-def", tokens.error],
  ];
  const body = vars
    .filter(([, value]) => HEX_RE.test(value))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  return `:root {\n${body}\n}\n`;
}

/** Pure validation: every token must be a #rrggbb hex. Throws on the first bad one. */
export function validateThemeTokens(tokens: ThemeTokens): void {
  for (const [key, value] of Object.entries(tokens)) {
    if (!HEX_RE.test(value)) {
      throw new Error(`Invalid color for ${key}: "${value}" (use #rrggbb)`);
    }
  }
}

async function ensureSchema(): Promise<void> {
  return ensureOnce("theme", async () => {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS studio_theme (
        tenant_id TEXT PRIMARY KEY,
        tokens JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  });
}

export async function getTheme(tenantId: string): Promise<ThemeTokens> {
  await ensureSchema();
  const res = await getPool().query<{ tokens: Partial<ThemeTokens> }>(
    `SELECT tokens FROM studio_theme WHERE tenant_id = $1`,
    [tenantId],
  );
  return { ...DEFAULT_THEME, ...(res.rows[0]?.tokens ?? {}) };
}

/** Validate every token is a #rrggbb hex, then upsert. */
export async function saveTheme(
  tenantId: string,
  tokens: ThemeTokens,
): Promise<void> {
  for (const [key, value] of Object.entries(tokens)) {
    if (!HEX_RE.test(value)) {
      throw new Error(`Invalid color for ${key}: "${value}" (use #rrggbb)`);
    }
  }
  await ensureSchema();
  await getPool().query(
    `INSERT INTO studio_theme (tenant_id, tokens, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (tenant_id)
     DO UPDATE SET tokens = EXCLUDED.tokens, updated_at = now()`,
    [tenantId, JSON.stringify(tokens)],
  );
}
