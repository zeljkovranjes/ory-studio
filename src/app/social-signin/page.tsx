import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { listProviders, PROVIDER_TYPES } from "@/lib/kratos-social";
import { Card, EmptyState, ErrorState, PageHeader, Table } from "@/components/ui";
import {
  Flash,
  SaveButton,
  SelectField,
  TextField,
  Toggle,
} from "@/components/forms";
import {
  addOidcProvider,
  deleteOidcProvider,
  saveOidcGeneral,
} from "./actions";

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

  const providers = listProviders(config);

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
            description="The base URL users are redirected to after a successful sign-in. Leave empty to use the public base URL."
            defaultValue={getPath(
              config,
              ["selfservice", "methods", "oidc", "config", "base_redirect_uri"],
              "",
            )}
            mono
            wide
          />
          <SaveButton />
        </form>
      </Card>

      <Card title="OpenID Connect providers">
        {providers.length === 0 ? (
          <EmptyState message="No providers configured yet. Add one below." />
        ) : (
          <Table headers={["ID", "Provider", "Client ID", "Scope", ""]}>
            {providers.map((provider) => (
              <tr key={provider.id} className="hover:bg-canvas">
                <td className="px-3 py-2 font-medium">{provider.id}</td>
                <td className="px-3 py-2 text-fg-muted">{provider.provider}</td>
                <td className="px-3 py-2 font-mono text-xs text-fg-muted">
                  {provider.client_id}
                </td>
                <td className="px-3 py-2 text-fg-muted">
                  {provider.scope?.join(", ") ?? "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <form action={deleteOidcProvider}>
                    <input type="hidden" name="id" value={provider.id} />
                    <button
                      type="submit"
                      className="text-sm text-error hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card
        title="Add new OpenID Connect provider"
        description="Client secrets are stored in the Kratos service config — keep the config volume out of version control in production deployments. The default identity mapper copies the verified email claim into traits.email."
      >
        <form action={addOidcProvider}>
          <TextField
            name="id"
            label="Provider ID"
            description="Unique identifier, e.g. google or acme-sso"
            placeholder="google"
          />
          <SelectField
            name="provider"
            label="Provider type"
            options={PROVIDER_TYPES.map((type) => ({
              value: type,
              label: type,
            }))}
          />
          <TextField name="client_id" label="Client ID" mono wide />
          <TextField name="client_secret" label="Client Secret" mono wide />
          <TextField
            name="issuer_url"
            label="Issuer URL"
            description="Required for the generic provider type; ignored otherwise"
            placeholder="https://accounts.example.com"
            mono
            wide
          />
          <TextField
            name="scope"
            label="Scope"
            description="Space or comma separated, e.g. email profile"
            placeholder="email profile"
          />
          <SaveButton label="Add provider" />
        </form>
      </Card>
    </>
  );
}
