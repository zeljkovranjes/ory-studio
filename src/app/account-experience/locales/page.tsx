import { listLocales } from "@/lib/locales";
import { currentTenant } from "@/lib/tenant";
import { Card, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import { Flash, SaveButton } from "@/components/forms";
import { deleteLocaleAction, saveLocaleAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LocalesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const tenant = await currentTenant();

  let locales: Awaited<ReturnType<typeof listLocales>> = [];
  let dbError: string | null = null;
  try {
    locales = await listLocales(tenant.id);
  } catch (err) {
    dbError = (err as Error).message;
  }

  return (
    <>
      <PageHeader
        title="Localization"
        description="Override account-experience message strings per locale. Each locale is a JSON map of message key → translated string. Saved overrides are served as JSON at /account-experience/locales/<locale>.json for a custom UI to consume."
      />
      <Flash {...flash} />

      {dbError ? (
        <Card>
          <ErrorState message={`Locale store unavailable: ${dbError}`} />
        </Card>
      ) : (
        <>
          {locales.length === 0 ? (
            <Card>
              <EmptyState message="No locale overrides yet. Add one below." />
            </Card>
          ) : (
            locales.map((l) => (
              <Card key={l.locale} title={l.locale}>
                <div className="mb-3 flex items-center justify-between">
                  <a
                    href={`/account-experience/locales/${l.locale}.json`}
                    className="text-sm text-accent hover:underline"
                  >
                    View JSON ↗
                  </a>
                  <form action={deleteLocaleAction}>
                    <input type="hidden" name="locale" value={l.locale} />
                    <button
                      type="submit"
                      className="text-sm text-error hover:underline"
                    >
                      Remove locale
                    </button>
                  </form>
                </div>
                <form action={saveLocaleAction}>
                  <input type="hidden" name="locale" value={l.locale} />
                  <textarea
                    name="messages"
                    rows={8}
                    defaultValue={JSON.stringify(l.messages, null, 2)}
                    spellCheck={false}
                    className="block w-full rounded border border-border bg-canvas p-3 font-mono text-xs focus:border-accent focus:outline-none"
                  />
                  <SaveButton />
                </form>
              </Card>
            ))
          )}

          <Card
            title="Add locale"
            description="Use a BCP-47 code (en, es, pt-BR). Messages are a JSON object of key → string."
          >
            <form action={saveLocaleAction} className="space-y-3">
              <label className="block text-sm">
                <span className="font-medium">Locale</span>
                <input
                  name="locale"
                  placeholder="es"
                  className="mt-1 block h-10 w-32 rounded border border-border px-3 font-mono text-sm focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Messages</span>
                <textarea
                  name="messages"
                  rows={6}
                  defaultValue={"{\n  \"login.title\": \"Iniciar sesión\"\n}"}
                  spellCheck={false}
                  className="mt-1 block w-full rounded border border-border bg-canvas p-3 font-mono text-xs focus:border-accent focus:outline-none"
                />
              </label>
              <SaveButton label="Add locale" />
            </form>
          </Card>
        </>
      )}
    </>
  );
}
