import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField } from "@/components/forms";
import { saveRedirects } from "./actions";

export const dynamic = "force-dynamic";

export default async function BrowserRedirectsPage({
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
        title="Browser Redirects"
        description="Browser redirects guide users back to your application after completing a flow (login, registration, verification, recovery, settings, logout)."
      />
      <Flash {...flash} />

      <Card title="Global redirect settings">
        <form action={saveRedirects}>
          <TextField
            name="default_url"
            label="Global redirect URL"
            description="The default browser redirect URL, used when no flow-specific redirect is set."
            defaultValue={getPath(
              config,
              ["selfservice", "default_browser_return_url"],
              "",
            )}
            mono
            wide
          />
          <label className="block py-2 text-sm">
            <span className="font-medium">Allowed URLs</span>
            <textarea
              name="allowed_urls"
              rows={8}
              defaultValue={getPath<string[]>(
                config,
                ["selfservice", "allowed_return_urls"],
                [],
              ).join("\n")}
              spellCheck={false}
              className="mt-1 block w-full rounded border border-border p-2 font-mono text-xs text-input-text focus:border-accent focus:outline-none"
            />
            <span className="mt-1 block text-fg-muted">
              One fully qualified URL per line. Return URLs outside this allow
              list are rejected.
            </span>
          </label>
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
