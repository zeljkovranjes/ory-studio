import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, TextField } from "@/components/forms";
import { saveUiUrls } from "./actions";

export const dynamic = "force-dynamic";

const FLOWS = [
  { name: "login", label: "Login UI" },
  { name: "registration", label: "Registration UI" },
  { name: "settings", label: "Settings UI" },
  { name: "verification", label: "Verification UI" },
  { name: "recovery", label: "Recovery UI" },
  { name: "error", label: "Error UI" },
];

export default async function UiUrlsPage({
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
        title="UI URLs"
        description="Where users are sent for each self-service flow. The bundle defaults point at the account experience container; replace them with your own custom UI pages when you build them."
      />
      <Flash {...flash} />

      <Card title="Custom UI URLs for Kratos flows">
        <form action={saveUiUrls}>
          {FLOWS.map((flow) => (
            <TextField
              key={flow.name}
              name={flow.name}
              label={flow.label}
              defaultValue={getPath(
                config,
                ["selfservice", "flows", flow.name, "ui_url"],
                "",
              )}
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
