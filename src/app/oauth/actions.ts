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
  try {
    const client = await createOAuth2Client(await currentTenant(), {
      client_name: String(formData.get("client_name") ?? "").trim() || undefined,
      grant_types: grantTypes,
      response_types: responseTypes.length > 0 ? responseTypes : ["code"],
      redirect_uris: redirectUris,
      scope: String(formData.get("scope") ?? "").trim() || undefined,
      token_endpoint_auth_method: String(
        formData.get("auth_method") ?? "client_secret_basic",
      ),
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
