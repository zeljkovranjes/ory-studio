import { Card, PageHeader } from "@/components/ui";

/**
 * Catch-all for IA routes that aren't implemented yet (see src/lib/nav.ts).
 * Keeps the full console navigation browsable during incremental milestones.
 */
export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  return (
    <>
      <PageHeader title={`/${slug.join("/")}`} />
      <Card>
        <p className="text-sm text-fg-muted">
          This page is part of the blueprint (see{" "}
          <code className="rounded bg-bg-subtle px-1 py-0.5 font-mono text-xs">
            docs/ory-console-extraction.md
          </code>
          ) but isn&apos;t implemented yet. The v1 milestone covers Identities,
          Sessions, Authentication and Message delivery.
        </p>
      </Card>
    </>
  );
}
