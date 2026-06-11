import { getTheme } from "@/lib/theme";
import { currentTenant } from "@/lib/tenant";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { Flash } from "@/components/forms";
import { ThemeEditor } from "./ThemeEditor";

export const dynamic = "force-dynamic";

export default async function ThemingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warning?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const accountExperienceUrl =
    process.env.NEXT_PUBLIC_ACCOUNT_EXPERIENCE_URL ?? "http://localhost:4455";

  const tenant = await currentTenant();
  let theme;
  let dbError: string | null = null;
  try {
    theme = await getTheme(tenant.id);
  } catch (err) {
    dbError = (err as Error).message;
  }

  return (
    <>
      <PageHeader
        title="UI theming"
        description="Theme the account experience with your brand colors. Edit the tokens and preview the login, then save. Tokens mirror Ory's --ory-theme-* variables; propagating them to the hosted account-experience UI uses Ory Elements theming."
      />
      <Flash {...flash} />

      <Card title="Theme">
        {dbError || !theme ? (
          <ErrorState message={`Theme store unavailable: ${dbError}`} />
        ) : (
          <ThemeEditor initial={theme} />
        )}
      </Card>

      <Card title="Account experience">
        <a
          href={accountExperienceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-accent hover:underline"
        >
          Open the account experience ↗
        </a>
        <p className="mt-2 text-sm text-fg-muted">
          Login, registration, recovery and verification flows run at this URL.
          To replace it with fully custom pages, set your own URLs under Branding
          → UI URLs.
        </p>
      </Card>
    </>
  );
}
