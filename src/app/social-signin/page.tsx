import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { listProviders, PROVIDER_CATALOG } from "@/lib/kratos-social";
import { currentTenant } from "@/lib/tenant";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField, Toggle } from "@/components/forms";
import { saveOidcGeneral } from "./actions";
import { ProviderManager, type ProviderView } from "./ProviderManager";

export const dynamic = "force-dynamic";

export default async function SocialSigninPage({
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

  const tenant = await currentTenant();
  const baseRedirect = getPath(
    config,
    ["selfservice", "methods", "oidc", "config", "base_redirect_uri"],
    "",
  );
  // The configured base, or the public Kratos URL the browser is redirected to.
  const redirectBase = baseRedirect || tenant.services.kratosPublicUrl;

  // Never send client secrets to the browser — strip them for the manager.
  const providers: ProviderView[] = listProviders(config).map((p) => ({
    id: p.id,
    provider: p.provider,
    label: p.label,
    client_id: p.client_id,
    issuer_url: p.issuer_url,
    scope: p.scope,
    microsoft_tenant: p.microsoft_tenant,
    subject_source: p.subject_source,
    apple_team_id: p.apple_team_id,
    apple_private_key_id: p.apple_private_key_id,
  }));

  return (
    <>
      <PageHeader
        title="OpenID Connect (OIDC)"
        description="OpenID Connect is an identity layer on top of OAuth 2.0. It lets your users sign in with third-party providers like Google or GitHub, and lets your application obtain basic profile information."
      />
      <Flash {...flash} />

      <Card title="General">
        <form action={saveOidcGeneral}>
          <Toggle
            name="enabled"
            label="Enable OpenID Connect"
            description="If enabled, users will be able to sign in using the configured providers"
            defaultChecked={getPath(
              config,
              ["selfservice", "methods", "oidc", "enabled"],
              false,
            )}
          />
          <TextField
            name="base_redirect_uri"
            label="Base Redirect URI"
            description="The base URL providers redirect back to after sign-in. Leave empty to use the public Kratos URL."
            defaultValue={baseRedirect}
            mono
            wide
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="OpenID Connect providers"
        description="Client secrets are stored in the Kratos service config — keep the config volume out of version control in production. The default identity mapper copies the verified email claim into traits.email."
      >
        <ProviderManager
          providers={providers}
          catalog={PROVIDER_CATALOG.map((c) => ({
            type: c.type,
            label: c.label,
            fields: c.fields,
          }))}
          redirectBase={redirectBase}
        />
      </Card>
    </>
  );
}
