import { currentTenant } from "@/lib/tenant";
import { probeHealth } from "@/lib/health";
import { Badge, Card, PageHeader, Table } from "@/components/ui";

export const dynamic = "force-dynamic";

const SDKS = [
  { name: "JavaScript / Express", doc: "https://www.ory.com/docs/getting-started/integrate-auth/expressjs" },
  { name: "React", doc: "https://www.ory.com/docs/getting-started/integrate-auth/react" },
  { name: "Next.js", doc: "https://www.ory.com/docs/getting-started/integrate-auth/nextjs" },
  { name: "Go", doc: "https://www.ory.com/docs/getting-started/integrate-auth/go" },
  { name: "Flutter", doc: "https://www.ory.com/docs/getting-started/integrate-auth/flutter" },
  { name: "PHP", doc: "https://www.ory.com/docs/getting-started/integrate-auth/php" },
];

export default async function GetStartedPage() {
  const tenant = await currentTenant();
  const env = [
    `export ORY_SDK_URL="${tenant.services.kratosPublicUrl}"`,
    `export ORY_KRATOS_ADMIN_URL="${tenant.services.kratosAdminUrl}"`,
    ...(tenant.services.hydraAdminUrl
      ? [`export ORY_HYDRA_ADMIN_URL="${tenant.services.hydraAdminUrl}"`]
      : []),
  ].join("\n");

  // Probe each configured service's readiness endpoint in parallel.
  const services = [
    { name: "Kratos (public)", url: tenant.services.kratosPublicUrl },
    { name: "Kratos (admin)", url: tenant.services.kratosAdminUrl },
    { name: "Hydra (admin)", url: tenant.services.hydraAdminUrl },
    { name: "Keto (read)", url: tenant.services.ketoReadUrl },
  ].filter((s): s is { name: string; url: string } => Boolean(s.url));
  const health = await Promise.all(
    services.map(async (s) => ({ ...s, result: await probeHealth(s.url) })),
  );

  return (
    <>
      <PageHeader
        title="Get started"
        description="Wire your application to this instance. The SDK URL below is the Kratos public endpoint your frontend talks to."
      />

      <Card
        title="Service health"
        description="Readiness of the bundled Ory services. A service marked down usually means its container isn't running or is still starting."
      >
        <Table headers={["Service", "Status"]}>
          {health.map((s) => (
            <tr key={s.name}>
              <td className="px-3 py-2 font-medium">{s.name}</td>
              <td className="px-3 py-2">
                <Badge tone={s.result.ok ? "success" : "error"}>
                  {s.result.ok
                    ? "ready"
                    : `down${s.result.status ? ` (${s.result.status})` : ""}`}
                </Badge>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Environment variables">
        <pre className="overflow-x-auto rounded bg-canvas p-3 font-mono text-xs">
          {env}
        </pre>
      </Card>

      <Card
        title="Quickstarts"
        description="Official Ory integration guides — they work against any self-hosted instance by pointing the SDK at your ORY_SDK_URL."
      >
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SDKS.map((sdk) => (
            <li key={sdk.name}>
              <a
                href={sdk.doc}
                target="_blank"
                rel="noreferrer"
                className="block rounded border border-border px-3 py-2 text-sm hover:border-accent hover:text-accent"
              >
                {sdk.name} ↗
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="The bundle">
        <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">
          <li>Identity & authentication — Ory Kratos (public :4433, admin :4434)</li>
          <li>OAuth2 / OpenID Connect — Ory Hydra (public :4444, admin :4445)</li>
          <li>Permissions — Ory Keto (read :4466, write :4467)</li>
          <li>Account experience UI — :4455 · Dev inbox (Mailpit) — :8025</li>
        </ul>
      </Card>
    </>
  );
}
