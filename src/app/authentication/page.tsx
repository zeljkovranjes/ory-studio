import { readKratosConfig } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, Toggle } from "@/components/forms";
import { saveRecoveryVerification, saveSignupLogin } from "./actions";

export const dynamic = "force-dynamic";

export default async function AuthenticationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const configPath =
    process.env.KRATOS_CONFIG_PATH ?? "./config/kratos/kratos.yml";
  const config = await readKratosConfig(configPath);

  return (
    <>
      <PageHeader
        title="General authentication settings"
        description="These settings affect the way your users can sign up and log in. Saving rewrites the Kratos configuration and reloads the service."
      />
      <Flash {...flash} />

      {"error" in config ? (
        <Card>
          <ErrorState
            message={`Could not read Kratos config at ${configPath}: ${config.error}`}
          />
        </Card>
      ) : (
        <>
          <Card title="Sign-up & login">
            <form action={saveSignupLogin}>
              <Toggle
                name="registration"
                label="Enable registration"
                description="If enabled, users can sign up using the self-service UIs"
                defaultChecked={config.registrationEnabled}
              />
              <Toggle
                name="password"
                label="Password authentication"
                description="If enabled, users can sign in and register using a password"
                defaultChecked={config.passwordEnabled}
              />
              <Toggle
                name="code"
                label="One-time code"
                description="If enabled, users can sign in using a one-time code sent via email"
                defaultChecked={config.codeEnabled}
              />
              <Toggle
                name="totp"
                label="TOTP (Authenticator apps)"
                description="If enabled, users can set up a second factor using an authenticator app"
                defaultChecked={config.totpEnabled}
              />
              <SaveButton />
            </form>
          </Card>

          <Card title="Recovery & verification">
            <form action={saveRecoveryVerification}>
              <Toggle
                name="recovery"
                label="Account recovery"
                description="Users can recover access to their account via a code sent to their address"
                defaultChecked={config.recoveryEnabled}
              />
              <Toggle
                name="verification"
                label="Address verification"
                description="Users can verify that they own an email address or phone number"
                defaultChecked={config.verificationEnabled}
              />
              <SaveButton />
            </form>
          </Card>
        </>
      )}
    </>
  );
}
