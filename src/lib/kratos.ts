/** Thin Kratos Admin API client. All calls are tenant-scoped. */

import type { TenantContext } from "./tenant";

export interface KratosCredential {
  type: string;
  identifiers?: string[];
  /** Secret config is redacted by the admin API unless include_credential is set. */
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface KratosIdentity {
  id: string;
  schema_id: string;
  state: "active" | "inactive";
  state_changed_at?: string;
  created_at: string;
  updated_at: string;
  traits: Record<string, unknown>;
  verifiable_addresses?: { value: string; verified: boolean; via: string }[];
  recovery_addresses?: { value: string; via: string }[];
  /** Keyed by credential type (password, oidc, totp, webauthn, lookup_secret, code). */
  credentials?: Record<string, KratosCredential>;
  metadata_public?: unknown;
  metadata_admin?: unknown;
}

export interface KratosSession {
  id: string;
  active: boolean;
  issued_at: string;
  expires_at: string;
  authenticated_at: string;
  authenticator_assurance_level: string;
  authentication_methods?: { method: string; completed_at: string }[];
  identity?: KratosIdentity;
  devices?: {
    ip_address?: string;
    user_agent?: string;
    location?: string;
  }[];
}

export interface CourierMessage {
  id: string;
  status: "queued" | "sent" | "processing" | "abandoned";
  type: "email" | "phone";
  recipient: string;
  subject: string;
  template_type: string;
  created_at: string;
  /** Present on the single-message admin GET, not on the list. */
  body?: string;
}

export interface PageResult<T> {
  items: T[];
  /** Opaque token for the next page, if any (Kratos `Link` header). */
  nextPageToken?: string;
  /** Total row count when the API reports it (`X-Total-Count`). */
  totalCount?: number;
  error?: string;
}

function parseNextPageToken(linkHeader: string | null): string | undefined {
  if (!linkHeader) return undefined;
  // Link: <...page_token=XYZ...>; rel="next"
  const next = linkHeader
    .split(",")
    .find((part) => part.includes('rel="next"'));
  const match = next?.match(/[?&]page_token=([^&>]+)/);
  return match?.[1];
}

async function adminGet<T>(
  tenant: TenantContext,
  path: string,
  params?: Record<string, string | undefined>,
): Promise<{ data: T; link: string | null; total?: number }> {
  const url = new URL(path, tenant.services.kratosAdminUrl);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Kratos admin API ${res.status} for ${url.pathname}`);
  }
  const totalHeader = res.headers.get("x-total-count");
  return {
    data: (await res.json()) as T,
    link: res.headers.get("link"),
    total: totalHeader ? Number(totalHeader) : undefined,
  };
}

export async function listIdentities(
  tenant: TenantContext,
  opts: { pageSize?: number; pageToken?: string; identifier?: string } = {},
): Promise<PageResult<KratosIdentity>> {
  try {
    const { data, link, total } = await adminGet<KratosIdentity[]>(
      tenant,
      "/admin/identities",
      {
        page_size: String(opts.pageSize ?? 25),
        page_token: opts.pageToken,
        credentials_identifier: opts.identifier,
      },
    );
    return {
      items: data,
      nextPageToken: parseNextPageToken(link),
      totalCount: total,
    };
  } catch (err) {
    return { items: [], error: (err as Error).message };
  }
}

export async function listSessions(
  tenant: TenantContext,
  opts: { pageSize?: number; pageToken?: string; active?: boolean } = {},
): Promise<PageResult<KratosSession>> {
  try {
    const { data, link } = await adminGet<KratosSession[]>(
      tenant,
      "/admin/sessions",
      {
        page_size: String(opts.pageSize ?? 25),
        page_token: opts.pageToken,
        active: opts.active === undefined ? undefined : String(opts.active),
      },
    );
    return { items: data, nextPageToken: parseNextPageToken(link) };
  } catch (err) {
    return { items: [], error: (err as Error).message };
  }
}

export async function listCourierMessages(
  tenant: TenantContext,
  opts: { pageSize?: number; pageToken?: string; status?: string } = {},
): Promise<PageResult<CourierMessage>> {
  try {
    const { data, link } = await adminGet<CourierMessage[]>(
      tenant,
      "/admin/courier/messages",
      {
        page_size: String(opts.pageSize ?? 25),
        page_token: opts.pageToken,
        status: opts.status,
      },
    );
    return { items: data, nextPageToken: parseNextPageToken(link) };
  } catch (err) {
    return { items: [], error: (err as Error).message };
  }
}

/** Fetch a single courier message including its rendered body. */
export async function getCourierMessage(
  tenant: TenantContext,
  id: string,
): Promise<CourierMessage> {
  const { data } = await adminGet<CourierMessage>(
    tenant,
    `/admin/courier/messages/${encodeURIComponent(id)}`,
  );
  return data;
}

/** Primary human-readable identifier of an identity (email, username, …). */
export function identityIdentifier(identity: KratosIdentity): string {
  const traits = identity.traits as { email?: string; username?: string };
  return traits.email ?? traits.username ?? identity.id;
}

async function adminSend<T>(
  tenant: TenantContext,
  method: "POST" | "DELETE" | "PATCH",
  path: string,
  body?: unknown,
): Promise<T> {
  const url = new URL(path, tenant.services.kratosAdminUrl);
  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const payload = (await res.json()) as {
        error?: { message?: string; reason?: string };
      };
      detail = payload.error?.reason ?? payload.error?.message ?? "";
    } catch {
      // non-JSON error body
    }
    throw new Error(
      `Kratos admin API ${res.status} for ${url.pathname}${detail ? `: ${detail}` : ""}`,
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function getIdentity(
  tenant: TenantContext,
  id: string,
): Promise<KratosIdentity> {
  const { data } = await adminGet<KratosIdentity>(
    tenant,
    `/admin/identities/${encodeURIComponent(id)}`,
  );
  return data;
}

export interface CreateIdentityInput {
  schemaId: string;
  traits: Record<string, unknown>;
  /** Optional initial password; sets a password credential on the identity. */
  password?: string;
}

/** Build the admin create-identity request body, including a password
 * credential only when an initial password is supplied. */
export function buildCreateIdentityBody(
  input: CreateIdentityInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    schema_id: input.schemaId,
    traits: input.traits,
  };
  if (input.password) {
    body.credentials = {
      password: { config: { password: input.password } },
    };
  }
  return body;
}

export async function createIdentity(
  tenant: TenantContext,
  input: CreateIdentityInput,
): Promise<KratosIdentity> {
  return adminSend<KratosIdentity>(
    tenant,
    "POST",
    "/admin/identities",
    buildCreateIdentityBody(input),
  );
}

export async function deleteIdentity(
  tenant: TenantContext,
  id: string,
): Promise<void> {
  await adminSend<void>(
    tenant,
    "DELETE",
    `/admin/identities/${encodeURIComponent(id)}`,
  );
}

/** Replace an identity's traits via a JSON Patch. Kratos still validates the
 * new traits against the identity's schema and returns 400 on mismatch. */
export async function updateIdentityTraits(
  tenant: TenantContext,
  id: string,
  traits: Record<string, unknown>,
): Promise<KratosIdentity> {
  return adminSend<KratosIdentity>(
    tenant,
    "PATCH",
    `/admin/identities/${encodeURIComponent(id)}`,
    [{ op: "replace", path: "/traits", value: traits }],
  );
}

/** Mark a verifiable address verified/unverified via a JSON Patch. The index
 * must be a validated array position (see parseAddressIndex). */
export async function setAddressVerified(
  tenant: TenantContext,
  id: string,
  index: number,
  verified: boolean,
): Promise<KratosIdentity> {
  return adminSend<KratosIdentity>(
    tenant,
    "PATCH",
    `/admin/identities/${encodeURIComponent(id)}`,
    [
      {
        op: "replace",
        path: `/verifiable_addresses/${index}/verified`,
        value: verified,
      },
    ],
  );
}

/** Replace an identity's admin or public metadata via a JSON Patch. */
export async function updateIdentityMetadata(
  tenant: TenantContext,
  id: string,
  field: "metadata_admin" | "metadata_public",
  value: unknown,
): Promise<KratosIdentity> {
  return adminSend<KratosIdentity>(
    tenant,
    "PATCH",
    `/admin/identities/${encodeURIComponent(id)}`,
    [{ op: "replace", path: `/${field}`, value }],
  );
}

/** Activate or deactivate an identity via a JSON Patch on its state. */
export async function setIdentityState(
  tenant: TenantContext,
  id: string,
  state: "active" | "inactive",
): Promise<KratosIdentity> {
  return adminSend<KratosIdentity>(
    tenant,
    "PATCH",
    `/admin/identities/${encodeURIComponent(id)}`,
    [{ op: "replace", path: "/state", value: state }],
  );
}

export async function listIdentitySessions(
  tenant: TenantContext,
  id: string,
): Promise<KratosSession[]> {
  try {
    const { data } = await adminGet<KratosSession[]>(
      tenant,
      `/admin/identities/${encodeURIComponent(id)}/sessions`,
    );
    return data ?? [];
  } catch {
    return [];
  }
}

export async function revokeIdentitySessions(
  tenant: TenantContext,
  id: string,
): Promise<void> {
  await adminSend<void>(
    tenant,
    "DELETE",
    `/admin/identities/${encodeURIComponent(id)}/sessions`,
  );
}

/** Deactivate a single session by id (admin DELETE /admin/sessions/{id}). */
export async function disableSession(
  tenant: TenantContext,
  sessionId: string,
): Promise<void> {
  await adminSend<void>(
    tenant,
    "DELETE",
    `/admin/sessions/${encodeURIComponent(sessionId)}`,
  );
}

export interface RecoveryCodeResult {
  recovery_code?: string;
  recovery_link?: string;
  expires_at?: string;
}

export async function createRecoveryCode(
  tenant: TenantContext,
  identityId: string,
): Promise<RecoveryCodeResult> {
  return adminSend<RecoveryCodeResult>(tenant, "POST", "/admin/recovery/code", {
    identity_id: identityId,
  });
}

export interface IdentitySchemaEntry {
  id: string;
  schema: Record<string, unknown>;
}

/** Identity schemas are served on the public API. */
export async function listIdentitySchemas(
  tenant: TenantContext,
): Promise<{ items: IdentitySchemaEntry[]; error?: string }> {
  try {
    const url = new URL("/schemas", tenant.services.kratosPublicUrl);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Kratos public API ${res.status} for /schemas`);
    return { items: (await res.json()) as IdentitySchemaEntry[] };
  } catch (err) {
    return { items: [], error: (err as Error).message };
  }
}
