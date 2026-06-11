import { getPath, readHydraRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, SelectField } from "@/components/forms";
import { saveStrategies } from "./actions";

export const dynamic = "force-dynamic";

export default async function OAuthStrategiesPage({
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
        title="Token Strategies Configuration"
        description="Global token strategy settings applicable to all OAuth2 clients."
      />
      <Flash {...flash} />

      <Card>
        <form action={saveStrategies}>
          <SelectField
            name="scope"
            label="Scope Strategy"
            description="How requested scopes are matched against the client's allowed scope."
            defaultValue={getPath(config, ["strategies", "scope"], "wildcard")}
            options={[
              { value: "wildcard", label: "Wildcard" },
              { value: "exact", label: "Exact" },
            ]}
          />
          <SelectField
            name="access_token"
            label="Access Token Strategy"
            description="Opaque tokens are random identifiers introspected server-side; JWT tokens are self-contained and verifiable offline."
            defaultValue={getPath(
              config,
              ["strategies", "access_token"],
              "opaque",
            )}
            options={[
              { value: "opaque", label: "Opaque" },
              { value: "jwt", label: "JWT" },
            ]}
          />
          <SelectField
            name="jwt_scope_claim"
            label="JWT Scope Claim"
            description="How the scope claim is encoded in JWT access tokens."
            defaultValue={getPath(
              config,
              ["strategies", "jwt", "scope_claim"],
              "list",
            )}
            options={[
              { value: "list", label: "List" },
              { value: "string", label: "String" },
              { value: "both", label: "Both" },
            ]}
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
