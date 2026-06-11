import { getPath, readHydraRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField, Toggle } from "@/components/forms";
import {
  saveDynamicRegistration,
  saveSubjectIdentifiers,
  saveWebfinger,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function OAuthOpenIdPage({
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

  const subjectTypes = getPath<string[]>(
    config,
    ["oidc", "subject_identifiers", "supported_types"],
    ["public"],
  );

  return (
    <>
      <PageHeader
        title="OpenID Connect Configuration"
        description="Global OpenID Connect settings applicable to all OAuth2 clients."
      />
      <Flash {...flash} />

      <Card
        title="Discovery document"
        description="Claims and scopes broadcast in the openid-configuration document. 'sub' and the standard scopes are always included."
      >
        <form action={saveWebfinger}>
          <TextField
            name="supported_claims"
            label="Supported Claims"
            description="Space or comma separated"
            defaultValue={getPath<string[]>(
              config,
              ["webfinger", "oidc_discovery", "supported_claims"],
              [],
            ).join(" ")}
            mono
            wide
          />
          <TextField
            name="supported_scope"
            label="Supported Scopes"
            description="Space or comma separated — 'offline', 'offline_access' and 'openid' are always included"
            defaultValue={getPath<string[]>(
              config,
              ["webfinger", "oidc_discovery", "supported_scope"],
              [],
            ).join(" ")}
            mono
            wide
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="Subject identifiers"
        description="Public identifiers expose the same subject to every client; pairwise identifiers derive a per-client subject using a salt."
      >
        <form action={saveSubjectIdentifiers}>
          <div className="flex gap-6 py-2 text-sm">
            {(["public", "pairwise"] as const).map((type) => (
              <label key={type} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  name="types"
                  value={type}
                  defaultChecked={subjectTypes.includes(type)}
                  className="h-4 w-4 accent-(--color-accent)"
                />
                <span className="font-mono text-xs">{type}</span>
              </label>
            ))}
          </div>
          <TextField
            name="pairwise_salt"
            label="Pairwise Salt"
            description="Used to derive pairwise subject identifiers; ignored when pairwise is disabled"
            defaultValue={getPath(
              config,
              ["oidc", "subject_identifiers", "pairwise", "salt"],
              "",
            )}
            mono
            wide
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="Dynamic Client Registration"
        description="Allows client applications to register themselves at runtime (RFC 7591) instead of being created by an administrator."
      >
        <form action={saveDynamicRegistration}>
          <Toggle
            name="enabled"
            label="Dynamic Client Registration"
            description="Enables the public client registration endpoint"
            defaultChecked={getPath(
              config,
              ["oidc", "dynamic_client_registration", "enabled"],
              false,
            )}
          />
          <TextField
            name="default_scope"
            label="Default Scope"
            description="Scopes granted to dynamically registered clients by default"
            defaultValue={getPath<string[]>(
              config,
              ["oidc", "dynamic_client_registration", "default_scope"],
              [],
            ).join(" ")}
            mono
            wide
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
