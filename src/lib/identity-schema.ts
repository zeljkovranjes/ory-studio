/**
 * Summarize a Kratos identity JSON Schema into a flat list of trait fields and
 * their roles, for a human-readable breakdown above the raw schema. Kratos
 * encodes field roles under the `ory.sh/kratos` vendor extension:
 *   credentials.{password,webauthn,code}.identifier → used to log in
 *   recovery.via                                     → used for account recovery
 *   verification.via                                 → used for verification
 */

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  identifier: boolean;
  recovery: boolean;
  verification: boolean;
  title?: string;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function isIdentifier(kratosExt: Record<string, unknown> | undefined): boolean {
  const creds = asRecord(kratosExt?.credentials);
  if (!creds) return false;
  return ["password", "webauthn", "code", "passkey"].some(
    (m) => asRecord(creds[m])?.identifier === true,
  );
}

/** Flatten the top-level trait fields of an identity schema with their roles. */
export function summarizeSchemaTraits(schema: unknown): SchemaField[] {
  const root = asRecord(schema);
  const traits = asRecord(asRecord(root?.properties)?.traits);
  const props = asRecord(traits?.properties);
  if (!props) return [];

  const required = Array.isArray(traits?.required)
    ? (traits!.required as unknown[]).filter(
        (r): r is string => typeof r === "string",
      )
    : [];

  return Object.entries(props).map(([name, raw]) => {
    const field = asRecord(raw) ?? {};
    const kratos = asRecord(field["ory.sh/kratos"]);
    const recovery = asRecord(kratos?.recovery);
    const verification = asRecord(kratos?.verification);
    return {
      name,
      type: typeof field.type === "string" ? field.type : "unknown",
      title: typeof field.title === "string" ? field.title : undefined,
      required: required.includes(name),
      identifier: isIdentifier(kratos),
      recovery: typeof recovery?.via === "string",
      verification: typeof verification?.via === "string",
    };
  });
}
