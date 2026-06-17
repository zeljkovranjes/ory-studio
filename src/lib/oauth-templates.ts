/**
 * Presets for the "Create OAuth2 client" template picker — they seed the grant
 * types, response types, and token-endpoint auth method for common client
 * shapes (matching the Ory Console templates).
 */
export interface ClientTemplate {
  key: string;
  label: string;
  description: string;
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
}

export const CLIENT_TEMPLATES: ClientTemplate[] = [
  {
    key: "server",
    label: "Server application",
    description: "Classical server-side rendered applications.",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_basic",
  },
  {
    key: "m2m",
    label: "Machine to machine",
    description:
      "Backend services, IoT devices, and other machine-to-machine communication.",
    grant_types: ["client_credentials"],
    response_types: [],
    token_endpoint_auth_method: "client_secret_basic",
  },
  {
    key: "spa",
    label: "Mobile / single-page app",
    description:
      "Mobile apps, single-page apps, and other public clients (no secret).",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  },
  {
    key: "custom",
    label: "Custom",
    description: "Your own custom OAuth2 client.",
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_basic",
  },
];

export function clientTemplate(key: string): ClientTemplate | undefined {
  return CLIENT_TEMPLATES.find((t) => t.key === key);
}
