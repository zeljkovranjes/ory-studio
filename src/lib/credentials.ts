import type { KratosCredential, KratosIdentity } from "./kratos";

/** Human labels for Kratos credential types shown on the identity detail page. */
const CREDENTIAL_LABELS: Record<string, string> = {
  password: "Password",
  oidc: "Social sign-in",
  totp: "Authenticator app (TOTP)",
  webauthn: "Passkey / WebAuthn",
  lookup_secret: "Backup recovery codes",
  code: "One-time code (email / SMS)",
};

export function credentialLabel(type: string): string {
  return CREDENTIAL_LABELS[type] ?? type;
}

export interface CredentialSummary {
  type: string;
  label: string;
  identifiers: string[];
  createdAt?: string;
}

/**
 * Flatten an identity's `credentials` map into a stable, display-ready list.
 * Kratos redacts secret config by default, so this only ever exposes the
 * credential type, its identifiers, and timestamps — never secrets.
 */
export function summarizeCredentials(
  identity: Pick<KratosIdentity, "credentials">,
): CredentialSummary[] {
  const creds = identity.credentials ?? {};
  return Object.entries(creds)
    .map(([type, cred]: [string, KratosCredential]) => ({
      type,
      label: credentialLabel(type),
      identifiers: cred.identifiers ?? [],
      createdAt: cred.created_at,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
