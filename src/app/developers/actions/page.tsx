import { readKratosRaw } from "@/lib/kratos-config";
import { listWebHooks } from "@/lib/kratos-hooks";
import { isCollectorHookUrl } from "@/lib/system-hooks";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
} from "@/components/ui";
import { Flash } from "@/components/forms";
import { CreateActionDialog } from "./CreateActionDialog";
import { deleteAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ActionsPage({
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

  // Hide the studio's own analytics collector webhooks — they're managed
  // automatically (Activity capture) and aren't user-facing actions.
  const hooks = listWebHooks(config).filter(
    (hook) => !isCollectorHookUrl(hook.url),
  );

  return (
    <>
      <PageHeader
        title="Actions"
        description="Actions run custom business logic in response to events in your authentication flows — user registration, login, password resets and more. Webhooks can enrich data, call external services, or interrupt a flow."
      />
      <Flash {...flash} />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium">Configured actions</h2>
          <CreateActionDialog />
        </div>

        {hooks.length === 0 ? (
          <EmptyState message="No actions yet. Create one — for example a webhook after registration." />
        ) : (
          <Table headers={["Action", "URL", "HTTP", "Interrupts", ""]}>
            {hooks.map((hook) => (
              <tr
                key={`${hook.flow}-${hook.timing}-${hook.method ?? "all"}-${hook.index}`}
                className="hover:bg-canvas"
              >
                <td className="px-4 py-3">
                  <span className="font-medium capitalize">{hook.flow}</span>{" "}
                  <Badge tone="muted">{hook.method ?? "all methods"}</Badge>{" "}
                  <span className="capitalize text-fg-muted">{hook.timing}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {hook.url}
                </td>
                <td className="px-4 py-3 text-fg-muted">{hook.httpMethod}</td>
                <td className="px-4 py-3">
                  {hook.canInterrupt ? (
                    <Badge tone="error">can interrupt</Badge>
                  ) : (
                    <span className="text-fg-subtle">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteAction}>
                    <input type="hidden" name="flow" value={hook.flow} />
                    <input type="hidden" name="timing" value={hook.timing} />
                    <input
                      type="hidden"
                      name="method"
                      value={hook.method ?? ""}
                    />
                    <input type="hidden" name="index" value={hook.index} />
                    <button
                      type="submit"
                      className="text-sm text-error hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
