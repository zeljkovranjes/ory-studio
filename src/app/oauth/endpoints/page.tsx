import { getPath, readHydraRaw } from "@/lib/kratos-config";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

function Endpoint({ label, url }: { label: string; url: string }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="text-sm font-medium">{label}</div>
      <code className="mt-1 block break-all font-mono text-xs text-fg-muted">
        {url}
      </code>
    </div>
  );
}

export default async function OAuthEndpointsPage() {
  const config = await readHydraRaw();
  const issuer = (
    "error" in config
      ? "http://localhost:4444"
      : getPath(config, ["urls", "self", "issuer"], "http://localhost:4444")
  ).replace(/\/$/, "");

  return (
    <>
      <PageHeader
        title="Endpoints"
        description="The OAuth2 / OpenID Connect endpoints exposed by your authorization server. The userinfo endpoint returns user attributes for a valid access token carrying the openid scope."
      />
      <Card>
        <Endpoint
          label="OpenID Connect Discovery Endpoint"
          url={`${issuer}/.well-known/openid-configuration`}
        />
        <Endpoint
          label="Well-Known JSON Web Keys"
          url={`${issuer}/.well-known/jwks.json`}
        />
        <Endpoint label="Authorize" url={`${issuer}/oauth2/auth`} />
        <Endpoint label="Token" url={`${issuer}/oauth2/token`} />
        <Endpoint label="User info" url={`${issuer}/userinfo`} />
        <Endpoint label="Token introspection (admin)" url={`${issuer.replace(":4444", ":4445")}/admin/oauth2/introspect`} />
      </Card>
    </>
  );
}
