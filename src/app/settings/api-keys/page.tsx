import { Card, PageHeader } from "@/components/ui";

export default function ApiKeysPage() {
  return (
    <>
      <PageHeader
        title="API Keys"
        description="Programmatic access to your instance."
      />
      <Card>
        <p className="text-sm text-fg-muted">
          In a self-hosted deployment the admin APIs (Kratos :4434, Hydra
          :4445, Keto :4467) live on your internal network and are not exposed
          publicly — protect them at the network layer and call them directly
          from trusted services. Studio-issued scoped API keys are planned for
          a later milestone.
        </p>
      </Card>
    </>
  );
}
