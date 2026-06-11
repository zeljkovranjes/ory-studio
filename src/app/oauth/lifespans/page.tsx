import { getPath, readHydraRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField } from "@/components/forms";
import { saveLifespans } from "./actions";

export const dynamic = "force-dynamic";

const FIELDS = [
  {
    name: "login_consent",
    path: ["ttl", "login_consent_request"],
    label: "Login/Consent Request TTL",
    description: "How long the user has to complete the login and consent flow.",
    fallback: "30m",
  },
  {
    name: "access_token",
    path: ["ttl", "access_token"],
    label: "Access Token TTL",
    description: "How long access tokens remain valid.",
    fallback: "1h",
  },
  {
    name: "refresh_token",
    path: ["ttl", "refresh_token"],
    label: "Refresh Token TTL",
    description: "How long refresh tokens remain valid.",
    fallback: "720h",
  },
  {
    name: "id_token",
    path: ["ttl", "id_token"],
    label: "ID Token TTL",
    description: "How long ID tokens remain valid.",
    fallback: "1h",
  },
  {
    name: "auth_code",
    path: ["ttl", "auth_code"],
    label: "Authorization Code TTL",
    description:
      "How long an authorization code can be exchanged for an access token.",
    fallback: "10m",
  },
];

export default async function OAuthLifespansPage({
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
        title="Token Lifespans Configuration"
        description="OAuth2 token lifespans and time-to-live settings. Use hour (h), minute (m), second (s) — for example: 1h, 30m, 720h."
      />
      <Flash {...flash} />

      <Card>
        <form action={saveLifespans}>
          {FIELDS.map((field) => (
            <TextField
              key={field.name}
              name={field.name}
              label={field.label}
              description={field.description}
              defaultValue={getPath(config, field.path, field.fallback)}
              mono
            />
          ))}
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
