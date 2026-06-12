import { isApiKeyExpired, listApiKeys } from "@/lib/api-keys";
import { currentTenant } from "@/lib/tenant";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  RelativeTime,
  Table,
} from "@/components/ui";
import { Flash } from "@/components/forms";
import { CreateKeyForm } from "./CreateKeyForm";
import { revokeKeyAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const tenant = await currentTenant();

  let keys: Awaited<ReturnType<typeof listApiKeys>> = [];
  let dbError: string | null = null;
  try {
    keys = await listApiKeys(tenant.id);
  } catch (err) {
    dbError = (err as Error).message;
  }

  return (
    <>
      <PageHeader
        title="API Keys"
        description="Studio API keys authenticate programmatic access — for example the event collector endpoint, alongside the configured collector token. Keys are stored hashed; the full value is shown only once at creation."
      />
      <Flash {...flash} />

      <Card title="API keys">
        {dbError ? (
          <ErrorState message={`Key store unavailable: ${dbError}`} />
        ) : keys.length === 0 ? (
          <EmptyState message="No API keys yet. Create one below." />
        ) : (
          <Table
            headers={["Name", "Prefix", "Created", "Last used", "Expires", ""]}
          >
            {keys.map((k) => (
              <tr key={k.id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium">{k.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                  {k.prefix}…
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  <RelativeTime iso={k.created_at} />
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {k.last_used_at ? <RelativeTime iso={k.last_used_at} /> : "never"}
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {!k.expires_at ? (
                    "never"
                  ) : isApiKeyExpired(k, Date.now()) ? (
                    <Badge tone="error">expired</Badge>
                  ) : (
                    <RelativeTime iso={k.expires_at} />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={revokeKeyAction}>
                    <input type="hidden" name="id" value={k.id} />
                    <button
                      type="submit"
                      className="text-sm text-error hover:underline"
                    >
                      Revoke
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Create API key">
        <CreateKeyForm />
      </Card>
    </>
  );
}
