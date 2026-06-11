import { getPath, readHydraRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField } from "@/components/forms";
import { saveUrls } from "./actions";

export const dynamic = "force-dynamic";

const FIELDS: { name: string; label: string; description: string }[] = [
  { name: "login", label: "Login", description: "The URL of the login UI." },
  {
    name: "registration",
    label: "Registration",
    description: "The URL of the registration UI.",
  },
  {
    name: "consent",
    label: "Consent",
    description: "The URL of the consent UI.",
  },
  { name: "logout", label: "Logout", description: "The URL of the logout UI." },
  {
    name: "post_logout_redirect",
    label: "Post Logout Redirect",
    description: "Where users land after logging out.",
  },
  { name: "error", label: "Error", description: "The URL of the error UI." },
];

export default async function OAuthUrlsPage({
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
        title="URLs Configuration"
        description="The UI endpoints used during OAuth2 flows — login, registration, consent, logout and error pages. The bundle defaults point at the account experience."
      />
      <Flash {...flash} />

      <Card>
        <form action={saveUrls}>
          {FIELDS.map((field) => (
            <TextField
              key={field.name}
              name={field.name}
              label={field.label}
              description={field.description}
              defaultValue={getPath(config, ["urls", field.name], "")}
              mono
              wide
            />
          ))}
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
