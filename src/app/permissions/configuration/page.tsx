import { readFile } from "fs/promises";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton } from "@/components/forms";
import { OplEditor } from "./OplEditor";
import { saveNamespaces } from "./actions";

export const dynamic = "force-dynamic";

export default async function PermissionsConfigurationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const path =
    process.env.KETO_NAMESPACES_PATH ?? "./config/keto/namespaces.keto.ts";

  let source: string | null = null;
  let readError: string | null = null;
  try {
    source = await readFile(path, "utf8");
  } catch (err) {
    readError = (err as Error).message;
  }

  return (
    <>
      <PageHeader
        title="Namespaces & Rules"
        description="The Ory Permission Language (OPL) is a TypeScript-based language for defining namespaces and permission rules. Namespaces are classes named after the singular type they describe — User, Document, Organization. Saving rewrites the namespaces file and reloads Keto."
      />
      <Flash {...flash} />

      <Card>
        {readError ? (
          <ErrorState
            message={`Could not read OPL file at ${path}: ${readError}`}
          />
        ) : (
          <form action={saveNamespaces}>
            <OplEditor initial={source ?? ""} />
            <SaveButton />
          </form>
        )}
      </Card>
    </>
  );
}
