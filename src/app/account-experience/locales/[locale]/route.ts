import { getLocale } from "@/lib/locales";
import { currentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/** Serve a locale's message overrides as JSON (e.g. /…/locales/es.json). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const clean = locale.replace(/\.json$/i, "");
  const tenant = await currentTenant();
  const messages = await getLocale(tenant.id, clean).catch(() => null);
  return new Response(JSON.stringify(messages ?? {}, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
