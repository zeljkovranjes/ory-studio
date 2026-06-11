import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField, Toggle } from "@/components/forms";
import {
  saveOneTimeCode,
  savePasskeys,
  saveWebauthnPasswordless,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function PasswordlessPage({
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
        title="Authentication without password"
        description="Configure passwordless methods to authenticate your users instead of a password. Take care not to change the WebAuthn enabled status after you have configured it, as it might lock some users out of their account."
      />
      <Flash {...flash} />

      <Card
        title="Passkeys"
        description="Passkeys are powered by the WebAuthn standard, based on public key cryptography, and supported by most modern browsers. Users authenticate with a physical security key or a biometric sensor such as Face ID or Touch ID."
      >
        <form action={savePasskeys}>
          <Toggle
            name="enabled"
            label="Enable Passkey authentication"
            description="If enabled, users will be able to sign in using passkeys"
            defaultChecked={getPath(
              config,
              ["selfservice", "methods", "passkey", "enabled"],
              false,
            )}
          />
          <TextField
            name="display_name"
            label="Display Name"
            description="What users see when prompted to authenticate"
            defaultValue={getPath(
              config,
              ["selfservice", "methods", "passkey", "config", "rp", "display_name"],
              "",
            )}
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="One-Time Codes"
        description="Passwordless login with one-time codes sends randomly generated codes to the user's email or phone number. Codes remain valid for a configurable time period and verify the user's identity during login."
      >
        <form action={saveOneTimeCode}>
          <Toggle
            name="enabled"
            label="Enable one-time code passwordless"
            description="If enabled, users will be able to sign in using a one-time code sent via email"
            defaultChecked={getPath(
              config,
              ["selfservice", "methods", "code", "passwordless_enabled"],
              false,
            )}
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="WebAuthn (legacy)"
        description="Prefer the Passkey strategy for passwordless authentication — it offers a better user experience. Only keep this enabled if you already have users using this method."
      >
        <form action={saveWebauthnPasswordless}>
          <Toggle
            name="enabled"
            label="Enable WebAuthn passwordless authentication"
            description="If enabled, users will be able to sign in using WebAuthn"
            defaultChecked={
              getPath(
                config,
                ["selfservice", "methods", "webauthn", "enabled"],
                false,
              ) &&
              getPath(
                config,
                ["selfservice", "methods", "webauthn", "config", "passwordless"],
                false,
              )
            }
          />
          <TextField
            name="display_name"
            label="Display Name"
            description="What users see when prompted to authenticate"
            defaultValue={getPath(
              config,
              ["selfservice", "methods", "webauthn", "config", "rp", "display_name"],
              "",
            )}
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
