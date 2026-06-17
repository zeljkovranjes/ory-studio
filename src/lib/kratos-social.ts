/** Helpers for the Social Sign-In (OIDC) provider list in kratos.yml. */

import { getPath } from "./kratos-config";

export const PROVIDER_TYPES = [
  "google",
  "github",
  "gitlab",
  "microsoft",
  "apple",
  "facebook",
  "discord",
  "slack",
  "spotify",
  "auth0",
  "generic",
] as const;

/** Provider-specific config fields a configure form may need. */
export type ProviderField =
  | "issuer_url"
  | "microsoft_tenant"
  | "subject_source"
  | "apple_team_id"
  | "apple_private_key_id";

export interface ProviderMeta {
  type: string;
  label: string;
  /** Extra fields beyond the common id/label/client_id/client_secret/scope. */
  fields: ProviderField[];
  /** Whether issuer_url is required (generic OIDC providers). */
  issuerRequired?: boolean;
}

/**
 * The provider catalog shown in the "Add provider" picker. Kratos has
 * first-class support for these types; anything else (Salesforce, Okta, an Ory
 * instance, …) is configured as "Generic" with an issuer URL.
 */
export const PROVIDER_CATALOG: ProviderMeta[] = [
  { type: "google", label: "Google", fields: [] },
  {
    type: "microsoft",
    label: "Microsoft",
    fields: ["microsoft_tenant", "subject_source"],
  },
  { type: "github", label: "GitHub", fields: [] },
  { type: "gitlab", label: "GitLab", fields: ["issuer_url"] },
  {
    type: "apple",
    label: "Apple",
    fields: ["apple_team_id", "apple_private_key_id"],
  },
  { type: "facebook", label: "Facebook", fields: [] },
  { type: "discord", label: "Discord", fields: [] },
  { type: "slack", label: "Slack", fields: [] },
  { type: "spotify", label: "Spotify", fields: [] },
  { type: "auth0", label: "Auth0", fields: ["issuer_url"], issuerRequired: true },
  {
    type: "generic",
    label: "Generic (any OIDC)",
    fields: ["issuer_url"],
    issuerRequired: true,
  },
];

export function providerMeta(type: string): ProviderMeta | undefined {
  return PROVIDER_CATALOG.find((p) => p.type === type);
}

export function providerLabel(type: string): string {
  return providerMeta(type)?.label ?? type;
}

export interface OidcProvider {
  id: string;
  provider: string;
  client_id: string;
  client_secret?: string;
  issuer_url?: string;
  mapper_url: string;
  scope?: string[];
  label?: string;
  microsoft_tenant?: string;
  subject_source?: string;
  apple_team_id?: string;
  apple_private_key_id?: string;
}

/**
 * Default identity data mapper: copies the verified email claim into
 * traits.email. Shipped inline (base64 jsonnet) so new providers work without
 * hosting a mapper file.
 */
const DEFAULT_MAPPER_JSONNET = `local claims = std.extVar('claims');
{
  identity: {
    traits: {
      [if 'email' in claims && claims.email_verified then 'email' else null]: claims.email,
    },
  },
}
`;

export function defaultMapperUrl(): string {
  return `base64://${Buffer.from(DEFAULT_MAPPER_JSONNET, "utf8").toString("base64")}`;
}

export function listProviders(config: unknown): OidcProvider[] {
  return getPath<OidcProvider[]>(config, PROVIDERS_PATH, []);
}

export interface ProviderInput {
  id: string;
  provider: string;
  clientId: string;
  clientSecret: string;
  label?: string;
  issuerUrl?: string;
  scope?: string;
  microsoftTenant?: string;
  subjectSource?: string;
  appleTeamId?: string;
  applePrivateKeyId?: string;
}

function buildProvider(input: ProviderInput, mapperUrl: string): OidcProvider {
  const trim = (v?: string) => {
    const t = (v ?? "").trim();
    return t || undefined;
  };
  return {
    id: input.id,
    provider: input.provider,
    client_id: input.clientId,
    client_secret: input.clientSecret || undefined,
    label: trim(input.label),
    issuer_url: trim(input.issuerUrl),
    mapper_url: mapperUrl,
    scope: input.scope
      ? input.scope
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
    microsoft_tenant: trim(input.microsoftTenant),
    subject_source: trim(input.subjectSource),
    apple_team_id: trim(input.appleTeamId),
    apple_private_key_id: trim(input.applePrivateKeyId),
  };
}

function validate(input: ProviderInput): void {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(input.id)) {
    throw new Error(
      "Provider ID must be 1-64 characters of letters, digits, '-' or '_'",
    );
  }
  const meta = providerMeta(input.provider);
  if (!meta) throw new Error(`Unknown provider type: ${input.provider}`);
  if (!input.clientId) throw new Error("Client ID is required");
  if (meta.issuerRequired && !/^https:\/\//.test((input.issuerUrl ?? "").trim())) {
    throw new Error(`${meta.label} requires an https:// issuer URL`);
  }
}

/**
 * Add a new provider or replace an existing one with the same ID. Returns the
 * full provider array to save. When updating, keeps the existing mapper unless
 * one isn't set. Client secret is preserved on edit if left blank.
 */
export function upsertProvider(
  config: unknown,
  input: ProviderInput,
  { isEdit = false }: { isEdit?: boolean } = {},
): OidcProvider[] {
  validate(input);
  const existing = listProviders(config);
  const current = existing.find((p) => p.id === input.id);
  if (current && !isEdit) {
    throw new Error(`A provider with ID "${input.id}" already exists`);
  }
  // On edit, a blank secret means "keep the existing one".
  const clientSecret =
    isEdit && !input.clientSecret ? (current?.client_secret ?? "") : input.clientSecret;
  const mapperUrl = current?.mapper_url ?? defaultMapperUrl();
  const entry = buildProvider({ ...input, clientSecret }, mapperUrl);
  if (current) {
    return existing.map((p) => (p.id === input.id ? entry : p));
  }
  return [...existing, entry];
}

/** Returns the provider array without the given ID. */
export function removeProvider(config: unknown, id: string): OidcProvider[] {
  return listProviders(config).filter((provider) => provider.id !== id);
}

export const PROVIDERS_PATH = [
  "selfservice",
  "methods",
  "oidc",
  "config",
  "providers",
];
