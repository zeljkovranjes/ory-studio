/**
 * Custom email templates, scoped to the active tenant. Stored in the studio DB
 * and propagated to Kratos courier template overrides on save (the "valid"
 * email variant of each supported type), so the templates are actually used.
 */

import { ensureOnce, getPool } from "./db";
import type { YamlPatch } from "./config-engine";

export const TEMPLATE_TYPES = [
  { id: "recovery_code", label: "Recovery code" },
  { id: "verification_code", label: "Verification code" },
  { id: "login_code", label: "Login code" },
] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number]["id"];

export interface EmailTemplate {
  template_type: string;
  subject: string;
  body: string;
}

async function ensureSchema(): Promise<void> {
  return ensureOnce("email-templates", async () => {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS studio_email_templates (
        tenant_id TEXT NOT NULL DEFAULT 'default',
        template_type TEXT NOT NULL,
        subject TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (tenant_id, template_type)
      );
    `);
  });
}

export async function listEmailTemplates(
  tenantId: string,
): Promise<Map<string, EmailTemplate>> {
  await ensureSchema();
  const res = await getPool().query<EmailTemplate>(
    `SELECT template_type, subject, body
     FROM studio_email_templates WHERE tenant_id = $1`,
    [tenantId],
  );
  return new Map(res.rows.map((r) => [r.template_type, r]));
}

const VALID_TYPES = new Set<string>(TEMPLATE_TYPES.map((t) => t.id));

export async function saveEmailTemplate(
  tenantId: string,
  input: { templateType: string; subject: string; body: string },
): Promise<void> {
  if (!VALID_TYPES.has(input.templateType)) {
    throw new Error(`Unknown template type: ${input.templateType}`);
  }
  if (!input.subject.trim()) throw new Error("Subject is required");
  if (!input.body.trim()) throw new Error("Body is required");
  await ensureSchema();
  await getPool().query(
    `INSERT INTO studio_email_templates (tenant_id, template_type, subject, body, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (tenant_id, template_type)
     DO UPDATE SET subject = EXCLUDED.subject, body = EXCLUDED.body, updated_at = now()`,
    [tenantId, input.templateType, input.subject, input.body],
  );
}

function b64(s: string): string {
  return `base64://${Buffer.from(s, "utf8").toString("base64")}`;
}

/**
 * Kratos courier override patches for one template's "valid" email variant.
 * Sets the subject and both body parts (html + plaintext) to the same content.
 */
export function buildCourierPatches(
  templateType: string,
  subject: string,
  body: string,
): YamlPatch[] {
  const base = ["courier", "templates", templateType, "valid", "email"];
  return [
    { path: [...base, "subject"], value: b64(subject) },
    { path: [...base, "body", "html"], value: b64(body) },
    { path: [...base, "body", "plaintext"], value: b64(body) },
  ];
}
