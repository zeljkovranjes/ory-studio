import {
  listEmailTemplates,
  TEMPLATE_TYPES,
} from "@/lib/email-templates";
import { currentTenant } from "@/lib/tenant";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton } from "@/components/forms";
import { saveEmailTemplateAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const tenant = await currentTenant();

  let templates: Awaited<ReturnType<typeof listEmailTemplates>> = new Map();
  let dbError: string | null = null;
  try {
    templates = await listEmailTemplates(tenant.id);
  } catch (err) {
    dbError = (err as Error).message;
  }

  return (
    <>
      <PageHeader
        title="Email templates"
        description="Customize the emails Kratos sends for recovery, verification and login codes. Saving stores the template and writes it into the Kratos courier config (the valid email variant), then reloads the service. Use Go templates — e.g. {{ .RecoveryCode }} or {{ .VerificationCode }}."
      />
      <Flash {...flash} />

      {dbError ? (
        <Card>
          <ErrorState message={`Template store unavailable: ${dbError}`} />
        </Card>
      ) : (
        TEMPLATE_TYPES.map((t) => {
          const tpl = templates.get(t.id);
          return (
            <Card key={t.id} title={t.label}>
              <form action={saveEmailTemplateAction} className="space-y-3">
                <input type="hidden" name="template_type" value={t.id} />
                <label className="block text-sm">
                  <span className="font-medium">Subject</span>
                  <input
                    name="subject"
                    defaultValue={tpl?.subject ?? ""}
                    placeholder={`Your ${t.label.toLowerCase()}`}
                    className="mt-1 block h-10 w-full max-w-xl rounded border border-border px-3 text-sm focus:border-accent focus:outline-none"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Body</span>
                  <textarea
                    name="body"
                    rows={6}
                    defaultValue={tpl?.body ?? ""}
                    placeholder={"Hi,\n\nYour code is {{ .RecoveryCode }}.\n"}
                    className="mt-1 block w-full rounded border border-border p-2 font-mono text-xs focus:border-accent focus:outline-none"
                  />
                </label>
                <SaveButton />
              </form>
            </Card>
          );
        })
      )}
    </>
  );
}
