/** Thin Hydra Admin API client. All calls are tenant-scoped. */

import type { TenantContext } from "./tenant";

export interface OAuth2Client {
  client_id: string;
  client_name?: string;
  client_secret?: string;
  grant_types?: string[];
  response_types?: string[];
  redirect_uris?: string[];
  scope?: string;
  token_endpoint_auth_method?: string;
  created_at?: string;
}

export interface PageResult<T> {
  items: T[];
  nextPageToken?: string;
  error?: string;
}

function adminUrl(tenant: TenantContext): string {
  const url = tenant.services.hydraAdminUrl;
  if (!url) {
    throw new Error(
      "Hydra admin URL is not configured (set ORY_HYDRA_ADMIN_URL)",
    );
  }
  return url;
}

function parseNextPageToken(linkHeader: string | null): string | undefined {
  if (!linkHeader) return undefined;
  const next = linkHeader
    .split(",")
    .find((part) => part.includes('rel="next"'));
  const match = next?.match(/[?&]page_token=([^&>]+)/);
  return match?.[1];
}

async function handleError(res: Response, pathname: string): Promise<never> {
  let detail = "";
  try {
    const payload = (await res.json()) as {
      error_description?: string;
      error?: { message?: string } | string;
    };
    detail =
      payload.error_description ??
      (typeof payload.error === "string"
        ? payload.error
        : (payload.error?.message ?? ""));
  } catch {
    // non-JSON error body
  }
  throw new Error(
    `Hydra admin API ${res.status} for ${pathname}${detail ? `: ${detail}` : ""}`,
  );
}

export async function listOAuth2Clients(
  tenant: TenantContext,
  opts: { pageSize?: number; pageToken?: string } = {},
): Promise<PageResult<OAuth2Client>> {
  try {
    const url = new URL("/admin/clients", adminUrl(tenant));
    url.searchParams.set("page_size", String(opts.pageSize ?? 25));
    if (opts.pageToken) url.searchParams.set("page_token", opts.pageToken);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) await handleError(res, url.pathname);
    return {
      items: (await res.json()) as OAuth2Client[],
      nextPageToken: parseNextPageToken(res.headers.get("link")),
    };
  } catch (err) {
    return { items: [], error: (err as Error).message };
  }
}

export async function createOAuth2Client(
  tenant: TenantContext,
  body: Partial<OAuth2Client>,
): Promise<OAuth2Client> {
  const url = new URL("/admin/clients", adminUrl(tenant));
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) await handleError(res, url.pathname);
  return (await res.json()) as OAuth2Client;
}

export async function deleteOAuth2Client(
  tenant: TenantContext,
  clientId: string,
): Promise<void> {
  const url = new URL(
    `/admin/clients/${encodeURIComponent(clientId)}`,
    adminUrl(tenant),
  );
  const res = await fetch(url, { method: "DELETE", cache: "no-store" });
  if (!res.ok && res.status !== 204) await handleError(res, url.pathname);
}
