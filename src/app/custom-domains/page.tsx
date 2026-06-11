import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField } from "@/components/forms";
import { saveDomain } from "./actions";

export const dynamic = "force-dynamic";

export default async function CustomDomainsPage({
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
        title="Domains"
        description="In a self-hosted deployment your domain is whatever your reverse proxy serves. Set the public base URL Kratos advertises and the cookie domain so authentication cookies are valid for your site."
      />
      <Flash {...flash} />

      <Card title="Public base URL & cookies">
        <form action={saveDomain}>
          <TextField
            name="base_url"
            label="Public base URL"
            description="The externally reachable URL of the Kratos public API, e.g. https://auth.example.com"
            defaultValue={getPath(
              config,
              ["serve", "public", "base_url"],
              "",
            )}
            mono
            wide
          />
          <TextField
            name="cookie_domain"
            label="Cookie domain"
            description="Bare hostname the session cookie is scoped to, e.g. example.com — leave empty for the default"
            defaultValue={getPath(config, ["cookies", "domain"], "")}
            mono
            wide
          />
          <SaveButton />
        </form>
      </Card>

      <Card
        title="Reverse proxy"
        description="Point your proxy (Caddy, nginx, Traefik) at the bundle: studio on :3000, Kratos public on :4433, Hydra public on :4444, account experience on :4455. Terminate TLS at the proxy and forward X-Forwarded-* headers."
      >
        <div />
      </Card>
    </>
  );
}
