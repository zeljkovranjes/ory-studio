import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField } from "@/components/forms";
import { saveEmailConfig } from "./actions";

export const dynamic = "force-dynamic";

export default async function EmailConfigurationPage({
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
        title="Email configuration"
        description="Configure how email notifications for the recovery and verification flows are sent to your users. The bundle ships Mailpit as a dev inbox at http://localhost:8025."
      />
      <Flash {...flash} />

      <Card
        title="SMTP server"
        description="Credentials in the connection URI are stored in the Kratos service config — keep the config volume out of version control in production deployments."
      >
        <form action={saveEmailConfig}>
          <TextField
            name="connection_uri"
            label="Connection URI"
            description="smtp:// or smtps:// URI, e.g. smtps://user:password@mail.example.com:465 (dev default points at Mailpit)"
            defaultValue={getPath(
              config,
              ["courier", "smtp", "connection_uri"],
              "",
            )}
            mono
            wide
          />
          <TextField
            name="from_address"
            label="Sender address"
            description="The From address on outgoing mail"
            defaultValue={getPath(
              config,
              ["courier", "smtp", "from_address"],
              "",
            )}
            wide
          />
          <TextField
            name="from_name"
            label="Sender name"
            description="The human-readable sender name"
            defaultValue={getPath(config, ["courier", "smtp", "from_name"], "")}
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
