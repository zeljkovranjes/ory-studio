import { env } from "@/lib/env";
import { currentTenant } from "@/lib/tenant";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border py-2.5 text-sm last:border-b-0">
      <span className="text-fg-muted">{label}</span>
      <code className="break-all text-right font-mono text-xs">{value}</code>
    </div>
  );
}

export default async function SettingsOverviewPage() {
  const tenant = await currentTenant();

  return (
    <>
      <PageHeader
        title="Instance overview"
        description="The studio drives one self-hosted Ory instance. Service endpoints and config paths come from the environment."
      />

      <Card title="Instance">
        <Row label="Tenancy mode" value={env.tenancyMode} />
        <Row label="Tenant" value={tenant.id} />
      </Card>

      <Card title="Service endpoints">
        <Row label="Kratos public" value={tenant.services.kratosPublicUrl} />
        <Row label="Kratos admin" value={tenant.services.kratosAdminUrl} />
        <Row
          label="Hydra admin"
          value={tenant.services.hydraAdminUrl ?? "not configured"}
        />
        <Row
          label="Keto read / write"
          value={`${tenant.services.ketoReadUrl ?? "—"} / ${tenant.services.ketoWriteUrl ?? "—"}`}
        />
      </Card>

      <Card title="Config files (owned by the studio)">
        <Row
          label="Kratos"
          value={process.env.KRATOS_CONFIG_PATH ?? "./config/kratos/kratos.yml"}
        />
        <Row
          label="Hydra"
          value={process.env.HYDRA_CONFIG_PATH ?? "./config/hydra/hydra.yml"}
        />
        <Row
          label="Keto namespaces"
          value={
            process.env.KETO_NAMESPACES_PATH ??
            "./config/keto/namespaces.keto.ts"
          }
        />
      </Card>
    </>
  );
}
