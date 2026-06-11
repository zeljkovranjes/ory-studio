import { Card, PageHeader } from "@/components/ui";

export default function EmailTemplatesPage() {
  return (
    <>
      <PageHeader
        title="Email templates"
        description="Customize the emails Kratos sends for recovery, verification and login codes."
      />
      <Card title="Custom templates">
        <p className="text-sm text-fg-muted">
          Kratos loads template overrides from
          <code className="mx-1 rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">
            courier.templates
          </code>
          in the service config — each template (e.g. recovery code, verification
          code) can point at custom subject and body files mounted into the
          container under
          <code className="mx-1 rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">
            config/kratos/
          </code>
          . A visual template editor lands in a later milestone; until then,
          edit the config file directly and reload from any Save button.
        </p>
      </Card>
    </>
  );
}
