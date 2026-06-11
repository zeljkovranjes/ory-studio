import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField, Toggle } from "@/components/forms";
import {
  saveCodeMfa,
  saveGeneralMfa,
  saveLookupSecrets,
  saveTotp,
  saveWebauthnMfa,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const config = await readKratosRaw();

  if ("error" in config) {
    return (
      <Card>
        <ErrorState message={`Could not read Kratos config: ${config.error}`} />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Two-Factor Authentication"
        description="Enabling two-factor authentication introduces an additional verification step that protects login and self-service actions, such as updating account information or credentials, from malicious actors."
      />
      <Flash {...flash} />

      <Card
        title="General settings"
        description="Whether users need to complete a second-factor challenge to sign in or modify their settings. Users without a second factor set up are not affected."
      >
        <form action={saveGeneralMfa}>
          <Toggle
            name="login_aal"
            label="Require second factor for login"
            description="If enabled, users will be forced to complete a second factor challenge before logging in."
            defaultChecked={
              getPath<string>(
                config,
                ["session", "whoami", "required_aal"],
                "aal1",
              ) === "highest_available"
            }
          />
          <Toggle
            name="settings_aal"
            label="Require second factor for self-service settings"
            description="If enabled, users need to complete a second factor challenge before accessing their settings (traits, password and other credentials)."
            defaultChecked={
              getPath<string>(
                config,
                ["selfservice", "flows", "settings", "required_aal"],
                "aal1",
              ) === "highest_available"
            }
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="One-Time Codes"
        description="Randomly generated codes sent via email or SMS that provide an additional security layer during authentication."
      >
        <form action={saveCodeMfa}>
          <Toggle
            name="enabled"
            label="Enable one-time code multi-factor authentication"
            description="If enabled, users can receive one-time codes to solve multi-factor authentication."
            defaultChecked={getPath(
              config,
              ["selfservice", "methods", "code", "mfa_enabled"],
              false,
            )}
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="TOTP (Authenticator Apps)"
        description="Users scan a QR code in an app like Google Authenticator or a password manager to generate time-bound temporary codes."
      >
        <form action={saveTotp}>
          <Toggle
            name="enabled"
            label="Enable TOTP Authenticator Apps"
            description="If enabled, users are able to set up a second factor using a TOTP authenticator app."
            defaultChecked={getPath(
              config,
              ["selfservice", "methods", "totp", "enabled"],
              false,
            )}
          />
          <TextField
            name="issuer"
            label="Display name"
            description="Shown in the authenticator app. Leave empty to use the project name."
            defaultValue={getPath(
              config,
              ["selfservice", "methods", "totp", "config", "issuer"],
              "",
            )}
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="WebAuthn"
        description="Part of FIDO2 and compatible with U2F — users authenticate using a USB or NFC hardware token, or the operating system credential store (Face ID, Touch ID)."
      >
        <form action={saveWebauthnMfa}>
          <Toggle
            name="enabled"
            label="Enable WebAuthn"
            description="If enabled, users are able to set up a second factor using WebAuthn."
            defaultChecked={getPath(
              config,
              ["selfservice", "methods", "webauthn", "enabled"],
              false,
            )}
          />
          <TextField
            name="display_name"
            label="Display name"
            description="Shown when users are prompted for WebAuthn. Leave empty to use the project name."
            defaultValue={getPath(
              config,
              ["selfservice", "methods", "webauthn", "config", "rp", "display_name"],
              "",
            )}
          />
          <TextField
            name="rp_id"
            label="Hostname"
            description="The hostname of the login page. Leave empty when using the bundled account experience."
            defaultValue={getPath(
              config,
              ["selfservice", "methods", "webauthn", "config", "rp", "id"],
              "",
            )}
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="Lookup secrets"
        description="Backup/recovery codes for when users lose access to their TOTP or WebAuthn devices. Each code is valid once."
      >
        <form action={saveLookupSecrets}>
          <Toggle
            name="enabled"
            label="Enable Lookup Secrets"
            description="If enabled, users are able to generate and use lookup secrets."
            defaultChecked={getPath(
              config,
              ["selfservice", "methods", "lookup_secret", "enabled"],
              false,
            )}
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
