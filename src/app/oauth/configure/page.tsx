import { getPath, readHydraRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField, Toggle } from "@/components/forms";
import { saveClaims, saveIssuer, savePkce, saveRefreshGrant } from "./actions";

export const dynamic = "force-dynamic";

export default async function OAuthGeneralPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const config = await readHydraRaw();

  if ("error" in config) {
    return (
      <Card>
        <ErrorState message={`Could not read Hydra config: ${config.error}`} />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Configuration"
        description="Global settings applicable to all OAuth2 clients."
      />
      <Flash {...flash} />

      <Card
        title="Issuer URL"
        description="Used as the 'iss' claim in access and ID tokens, and by clients to discover the OpenID Connect configuration."
      >
        <form action={saveIssuer}>
          <TextField
            name="issuer"
            label="Issuer URL"
            defaultValue={getPath(config, ["urls", "self", "issuer"], "")}
            placeholder="https://auth.example.com"
            mono
            wide
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="Claim customization"
        description="Settings related to claims in access tokens, applied to all OAuth 2.0 clients."
      >
        <form action={saveClaims}>
          <TextField
            name="allowed_claims"
            label="Allowed top-level claims"
            description="Space or comma separated list of claims allowed at the top level of the access token"
            defaultValue={getPath<string[]>(
              config,
              ["oauth2", "allowed_top_level_claims"],
              [],
            ).join(" ")}
            mono
            wide
          />
          <Toggle
            name="mirror"
            label="Mirror top-level claims"
            description="Mirrors the top-level claims into the 'ext' claim"
            defaultChecked={getPath(
              config,
              ["oauth2", "mirror_top_level_claims"],
              false,
            )}
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="Refresh token grant"
        description="How long a refresh token remains valid after it has been used (rotation grace period)."
      >
        <form action={saveRefreshGrant}>
          <TextField
            name="grace_period"
            label="Rotation grace period"
            description="e.g. 30s or 5m — leave empty to disable grace reuse"
            defaultValue={getPath(
              config,
              ["oauth2", "grant", "refresh_token", "rotation_grace_period"],
              "",
            )}
            mono
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="PKCE"
        description="Proof Key for Code Exchange protects the authorization code flow against interception."
      >
        <form action={savePkce}>
          <Toggle
            name="enforced"
            label="PKCE enforced"
            description="Require PKCE for all OAuth 2.0 clients"
            defaultChecked={getPath(
              config,
              ["oauth2", "pkce", "enforced"],
              false,
            )}
          />
          <Toggle
            name="enforced_public"
            label="PKCE enforced for public clients"
            description="Require PKCE for public OAuth 2.0 clients"
            defaultChecked={getPath(
              config,
              ["oauth2", "pkce", "enforced_for_public_clients"],
              false,
            )}
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
