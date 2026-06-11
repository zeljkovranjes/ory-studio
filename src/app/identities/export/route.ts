import { listIdentities, identityIdentifier } from "@/lib/kratos";
import { currentTenant } from "@/lib/tenant";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const MAX_PAGES = 200; // safety cap (~5k identities at page_size 25)

/** Download all identities as CSV. Behind the studio session via middleware. */
export async function GET() {
  const tenant = await currentTenant();
  const rows: unknown[][] = [];
  let pageToken: string | undefined;

  for (let i = 0; i < MAX_PAGES; i++) {
    const page = await listIdentities(tenant, { pageSize: 100, pageToken });
    if (page.error) {
      return new Response(`Could not reach Kratos: ${page.error}`, {
        status: 502,
      });
    }
    for (const identity of page.items) {
      rows.push([
        identity.id,
        identityIdentifier(identity),
        identity.schema_id,
        identity.state,
        identity.created_at,
      ]);
    }
    if (!page.nextPageToken) break;
    pageToken = page.nextPageToken;
  }

  const csv = toCsv(
    ["id", "identifier", "schema", "state", "created_at"],
    rows,
  );
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="identities.csv"',
    },
  });
}
