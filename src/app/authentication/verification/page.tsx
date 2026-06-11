import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, SelectField, Toggle } from "@/components/forms";
import { saveVerification } from "./actions";

export const dynamic = "force-dynamic";

export default async function VerificationPage({
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
        title="Address Verification"
        description="Email / phone verification involves the user confirming a challenge (such as a code sent to their address) to prove that they have access to it."
      />
      <Flash {...flash} />

      <Card title="Verification">
        <form action={saveVerification}>
          <Toggle
            name="enabled"
            label="Enable Email / Phone Verification"
            description="If enabled, users are able to verify that they own a phone number or email address."
            defaultChecked={getPath(
              config,
              ["selfservice", "flows", "verification", "enabled"],
              false,
            )}
          />
          <Toggle
            name="notify_unknown"
            label="Notify unknown recipients"
            description="If enabled, the system sends a notification to the recipient if verification was requested for an unregistered account."
            defaultChecked={getPath(
              config,
              [
                "selfservice",
                "flows",
                "verification",
                "notify_unknown_recipients",
              ],
              false,
            )}
          />
          <SelectField
            name="use"
            label="Verification strategy"
            description="One-time codes are preferred: magic links break when email scanners open them, don't support API flows on mobile, and may open in a different browser than the one that started the flow."
            defaultValue={getPath(
              config,
              ["selfservice", "flows", "verification", "use"],
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
