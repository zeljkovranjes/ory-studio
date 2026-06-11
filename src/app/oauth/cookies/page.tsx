import { getPath, readHydraRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, SelectField, Toggle } from "@/components/forms";
import { saveCookies } from "./actions";

export const dynamic = "force-dynamic";

export default async function OAuthCookiesPage({
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
        title="Cookies Configuration"
        description="Attributes of cookies issued during browser-based OAuth2 flows. These settings apply to all OAuth2 clients."
      />
      <Flash {...flash} />

      <Card>
        <form action={saveCookies}>
          <SelectField
            name="same_site"
            label="SameSite Cookie Mode"
            description="The SameSite attribute for cookies used in browser-based OAuth2 flows."
            defaultValue={getPath(
              config,
              ["serve", "cookies", "same_site_mode"],
              "Lax",
            )}
            options={[
              { value: "Lax", label: "Lax" },
              { value: "Strict", label: "Strict" },
              { value: "None", label: "None" },
            ]}
          />
          <Toggle
            name="legacy_workaround"
            label="Legacy SameSite=None workaround"
            description="When SameSite is None, issues a second CSRF cookie for compatibility with some older browsers."
            defaultChecked={getPath(
              config,
              ["serve", "cookies", "same_site_legacy_workaround"],
              false,
            )}
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
