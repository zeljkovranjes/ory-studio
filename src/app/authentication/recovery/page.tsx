import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, SelectField, Toggle } from "@/components/forms";
import { saveRecovery } from "./actions";

export const dynamic = "force-dynamic";

export default async function RecoveryPage({
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
        title="Account recovery"
        description="Account recovery allows users to regain access to their account if they lose their password or their social login account is deactivated. This method does not recover access to a second authentication factor."
      />
      <Flash {...flash} />

      <Card title="Recovery">
        <form action={saveRecovery}>
          <Toggle
            name="enabled"
            label="Enable account recovery"
            description="If enabled, users can recover access to their account by receiving a one-time code or magic link at the address associated with their account."
            defaultChecked={getPath(
              config,
              ["selfservice", "flows", "recovery", "enabled"],
              false,
            )}
          />
          <Toggle
            name="notify_unknown"
            label="Notify unknown recipients"
            description="If enabled, the system notifies unregistered addresses that account recovery was requested for that address."
            defaultChecked={getPath(
              config,
              ["selfservice", "flows", "recovery", "notify_unknown_recipients"],
              false,
            )}
          />
          <SelectField
            name="use"
            label="Recovery strategy"
            description="One-time codes are preferred: magic links break when email scanners open them, don't support API flows on mobile, and may open in a different browser than the one that started the flow."
            defaultValue={getPath(
              config,
              ["selfservice", "flows", "recovery", "use"],
              "code",
            )}
            options={[
              { value: "code", label: "One-time passwords" },
              { value: "link", label: "Magic links" },
            ]}
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
