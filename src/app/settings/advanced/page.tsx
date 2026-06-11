import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton, SelectField, Toggle } from "@/components/forms";
import { saveAdvanced } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdvancedPage({
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
        title="Advanced"
        description="Lower-level switches for the identity service. Changes reload Kratos."
      />
      <Flash {...flash} />

      <Card title="Diagnostics & behavior">
        <form action={saveAdvanced}>
          <SelectField
            name="log_level"
            label="Log level"
            description="Verbosity of the Kratos service logs"
            defaultValue={getPath(config, ["log", "level"], "info")}
            options={["trace", "debug", "info", "warning", "error"].map(
              (level) => ({ value: level, label: level }),
            )}
          />
          <Toggle
            name="one_step"
            label="Legacy one-step registration"
            description="Restores the single-step registration style instead of the profile-first flow"
            defaultChecked={getPath(
              config,
              [
                "selfservice",
                "flows",
                "registration",
                "enable_legacy_one_step",
              ],
              false,
            )}
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
