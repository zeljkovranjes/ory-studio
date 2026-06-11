import { getPath, readKratosRaw } from "@/lib/kratos-config";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import {
  Flash,
  SaveButton,
  SelectField,
  TextField,
  Toggle,
} from "@/components/forms";
import { saveSessionSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SessionSettingsPage({
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
        title="Sessions settings"
        description="Session lifespan defines how long a user stays authenticated after signing in. Privileged sessions govern how long a session may change sensitive settings (password, second factor, email) after authentication."
      />
      <Flash {...flash} />

      <Card title="Session lifespan & cookies">
        <form action={saveSessionSettings}>
          <TextField
            name="lifespan"
            label="Current session lifespan"
            description="Define for how long a user session is valid. Use hour (h), minute (m), second (s) — for example: 1h1m10s, 10s, 1h"
            defaultValue={getPath(config, ["session", "lifespan"], "72h")}
            mono
          />
          <TextField
            name="privileged_age"
            label="Privileged session age"
            description="Define for how long a session is considered privileged."
            defaultValue={getPath(
              config,
              ["selfservice", "flows", "settings", "privileged_session_max_age"],
              "15m",
            )}
            mono
          />
          <SelectField
            name="same_site"
            label="Same Site"
            description="Controls the same-site attribute of session cookies."
            defaultValue={getPath(
              config,
              ["session", "cookie", "same_site"],
              "Lax",
            )}
            options={[
              { value: "Lax", label: "Lax" },
              { value: "Strict", label: "Strict" },
              { value: "None", label: "None" },
            ]}
          />
          <Toggle
            name="persistent"
            label="Persist sessions"
            description="If enabled, the session cookie will be persisted across browser restarts."
            defaultChecked={getPath(
              config,
              ["session", "cookie", "persistent"],
              true,
            )}
          />
          <SaveButton />
        </form>
      </Card>
    </>
  );
}
