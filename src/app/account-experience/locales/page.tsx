import { Card, PageHeader } from "@/components/ui";

export default function LocalesPage() {
  return (
    <>
      <PageHeader
        title="Localization"
        description="Translate the account experience for your users."
      />
      <Card>
        <p className="text-sm text-fg-muted">
          The bundled account experience ships with English strings. To
          localize, either fork the self-service UI container and provide
          translations there, or point Branding → UI URLs at your own custom
          pages with full control over copy and languages. A built-in
          localization editor is planned for a later milestone.
        </p>
      </Card>
    </>
  );
}
