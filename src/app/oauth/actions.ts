"use server";

import { requireSession } from "@/lib/require-session";

import {
  createOAuth2Client,
  deleteOAuth2Client,
  parseRedirectUris,
  type OAuth2Client,
} from "@/lib/hydra";
import { flashRedirect } from "@/lib/flash";
import { currentTenant } from "@/lib/tenant";

export interface CreateClientState {
  client?: OAuth2Client;
  error?: string;
}

export async function createClientAction(
  _prev: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  await requireSession();
  const grantTypes = formData.getAll("grant_types").map(String);
  const responseTypes = formData.getAll("response_types").map(String);
  const { uris: redirectUris, invalid } = parseRedirectUris(
    String(formData.get("redirect_uris") ?? ""),
  );
  if (invalid.length > 0) {
    return { error: `Invalid redirect URI: ${invalid.join(", ")}` };
  }
  if (grantTypes.length === 0) {
    return { error: "Select at least one grant type" };
  }

  const lines = (name: string): string[] =>
    String(formData.get(name) ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  const str = (name: string): string | undefined =>
    String(formData.get(name) ?? "").trim() || undefined;

  // Metadata is optional freeform JSON.
  let metadata: Record<string, unknown> | undefined;
  const metaRaw = String(formData.get("metadata") ?? "").trim();
  if (metaRaw) {
    try {
      const parsed = JSON.parse(metaRaw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { error: "Metadata must be a JSON object" };
      }
      metadata = parsed as Record<string, unknown>;
    } catch {
      return { error: "Metadata must be valid JSON" };
    }
  }

  // Validate the optional logout / post-logout URIs the same way as redirects.
  const postLogout = parseRedirectUris(String(formData.get("post_logout_redirect_uris") ?? ""));
  if (postLogout.invalid.length > 0) {
    return { error: `Invalid post-logout redirect URI: ${postLogout.invalid.join(", ")}` };
  }

  try {
    const client = await createOAuth2Client(await currentTenant(), {
      client_name: str("client_name"),
      grant_types: grantTypes,
      response_types: responseTypes.length > 0 ? responseTypes : ["code"],
      redirect_uris: redirectUris,
      scope: str("scope"),
      token_endpoint_auth_method: String(
        formData.get("auth_method") ?? "client_secret_basic",
      ),
      audience: lines("audience"),
      allowed_cors_origins: lines("allowed_cors_origins"),
      client_uri: str("client_uri"),
      policy_uri: str("policy_uri"),
      tos_uri: str("tos_uri"),
      contacts: lines("contacts"),
      skip_consent: formData.get("skip_consent") === "on",
      backchannel_logout_uri: str("backchannel_logout_uri"),
      frontchannel_logout_uri: str("frontchannel_logout_uri"),
      post_logout_redirect_uris: postLogout.uris,
      jwks_uri: str("jwks_uri"),
      metadata,
    });
    return { client };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function deleteClientAction(formData: FormData): Promise<void> {
  await requireSession();
  try {
    await deleteOAuth2Client(
      await currentTenant(),
      String(formData.get("client_id") ?? ""),
    );
  } catch (err) {
    flashRedirect("/oauth", { ok: false, error: (err as Error).message });
  }
  flashRedirect("/oauth", { ok: true });
}
