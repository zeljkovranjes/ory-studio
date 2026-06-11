/** Thin Keto read/write API client. All calls are tenant-scoped. */

import type { TenantContext } from "./tenant";

export interface RelationTuple {
  namespace: string;
  object: string;
  relation: string;
  subject_id?: string;
  subject_set?: { namespace: string; object: string; relation: string };
}

export interface RelationshipPage {
  items: RelationTuple[];
  nextPageToken?: string;
  error?: string;
}

function readUrl(tenant: TenantContext): string {
  const url = tenant.services.ketoReadUrl;
  if (!url) {
    throw new Error("Keto read URL is not configured (set ORY_KETO_READ_URL)");
  }
  return url;
}

function writeUrl(tenant: TenantContext): string {
  const url = tenant.services.ketoWriteUrl;
  if (!url) {
    throw new Error(
      "Keto write URL is not configured (set ORY_KETO_WRITE_URL)",
    );
  }
  return url;
}

async function handleError(res: Response, pathname: string): Promise<never> {
  let detail = "";
  try {
    const payload = (await res.json()) as {
      error?: { message?: string; reason?: string };
      message?: string;
    };
    detail =
      payload.error?.reason ?? payload.error?.message ?? payload.message ?? "";
  } catch {
    // non-JSON error body
  }
  throw new Error(
    `Keto API ${res.status} for ${pathname}${detail ? `: ${detail}` : ""}`,
  );
}

export async function listRelationships(
  tenant: TenantContext,
  opts: {
    namespace?: string;
    object?: string;
    relation?: string;
    subjectId?: string;
    pageToken?: string;
    pageSize?: number;
  } = {},
): Promise<RelationshipPage> {
  try {
    const url = new URL("/relation-tuples", readUrl(tenant));
    url.searchParams.set("page_size", String(opts.pageSize ?? 30));
    if (opts.namespace) url.searchParams.set("namespace", opts.namespace);
    if (opts.object) url.searchParams.set("object", opts.object);
    if (opts.relation) url.searchParams.set("relation", opts.relation);
    if (opts.subjectId) url.searchParams.set("subject_id", opts.subjectId);
    if (opts.pageToken) url.searchParams.set("page_token", opts.pageToken);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) await handleError(res, url.pathname);
    const payload = (await res.json()) as {
      relation_tuples?: RelationTuple[];
      next_page_token?: string;
    };
    return {
      items: payload.relation_tuples ?? [],
      nextPageToken: payload.next_page_token || undefined,
    };
  } catch (err) {
    return { items: [], error: (err as Error).message };
  }
}

export async function createRelationship(
  tenant: TenantContext,
  tuple: RelationTuple,
): Promise<void> {
  const url = new URL("/admin/relation-tuples", writeUrl(tenant));
  const res = await fetch(url, {
    method: "PUT",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tuple),
  });
  if (!res.ok && res.status !== 201) await handleError(res, url.pathname);
}

export async function deleteRelationship(
  tenant: TenantContext,
  tuple: RelationTuple,
): Promise<void> {
  const url = new URL("/admin/relation-tuples", writeUrl(tenant));
  url.searchParams.set("namespace", tuple.namespace);
  url.searchParams.set("object", tuple.object);
  url.searchParams.set("relation", tuple.relation);
  if (tuple.subject_id) url.searchParams.set("subject_id", tuple.subject_id);
  const res = await fetch(url, { method: "DELETE", cache: "no-store" });
  if (!res.ok && res.status !== 204) await handleError(res, url.pathname);
}

/** Namespaces parsed out of the OPL file (class X implements Namespace). */
export function namespacesFromOpl(source: string): string[] {
  const matches = source.matchAll(/class\s+([A-Za-z0-9_]+)\s+implements\s+Namespace/g);
  return [...matches].map((match) => match[1]);
}
