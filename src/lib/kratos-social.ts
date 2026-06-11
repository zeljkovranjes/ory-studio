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

export interface OidcProvider {
  id: string;
  provider: string;
  client_id: string;
  client_secret?: string;
  issuer_url?: string;
  mapper_url: string;
  scope?: string[];
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
  return getPath<OidcProvider[]>(
    config,
    ["selfservice", "methods", "oidc", "config", "providers"],
    [],
  );
}

export interface NewProviderInput {
  id: string;
  provider: string;
  clientId: string;
  clientSecret: string;
  issuerUrl?: string;
  scope?: string;
}

/** Validate + build a provider entry; returns the new full provider array. */
export function addProvider(
  config: unknown,
  input: NewProviderInput,
): OidcProvider[] {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(input.id)) {
    throw new Error(
      "Provider ID must be 1-64 characters of letters, digits, '-' or '_'",
    );
  }
  if (!(PROVIDER_TYPES as readonly string[]).includes(input.provider)) {
    throw new Error(`Unknown provider type: ${input.provider}`);
  }
  if (!input.clientId) {
    throw new Error("Client ID is required");
  }
  if (input.provider === "generic" && !/^https:\/\//.test(input.issuerUrl ?? "")) {
    throw new Error("Generic providers require an https:// issuer URL");
  }
  const existing = listProviders(config);
  if (existing.some((provider) => provider.id === input.id)) {
    throw new Error(`A provider with ID "${input.id}" already exists`);
  }
  const entry: OidcProvider = {
    id: input.id,
    provider: input.provider,
    client_id: input.clientId,
    client_secret: input.clientSecret || undefined,
    issuer_url: input.issuerUrl || undefined,
    mapper_url: defaultMapperUrl(),
    scope: input.scope
      ? input.scope
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
  };
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
