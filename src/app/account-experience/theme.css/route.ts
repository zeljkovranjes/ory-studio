import { DEFAULT_THEME, getTheme, themeToCss } from "@/lib/theme";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * Serve the saved brand theme as the --ory-theme-* CSS variables Ory Elements
 * reads. Public (non-sensitive colors, exempt from the session gate) so the
 * account-experience UI can load it via a <link rel="stylesheet">.
 */
export async function GET() {
  const theme = await getTheme(DEFAULT_TENANT_ID).catch(() => DEFAULT_THEME);
  return new Response(themeToCss(theme), {
    headers: {
      "content-type": "text/css; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
}
