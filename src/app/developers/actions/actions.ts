"use server";

import { requireSession } from "@/lib/require-session";

import { saveKratosPatches } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";
import { readKratosRaw } from "@/lib/kratos-config";
import { addWebHook, removeWebHook, type HookAuth } from "@/lib/kratos-hooks";

const PAGE = "/developers/actions";

function readAuth(formData: FormData): HookAuth {
  const type = String(formData.get("auth_type") ?? "none");
  if (type === "basic") {
    return {
      type: "basic",
      user: String(formData.get("auth_user") ?? "").trim(),
      password: String(formData.get("auth_password") ?? ""),
    };
  }
  if (type === "key") {
    const inLoc = String(formData.get("auth_key_in") ?? "header");
    return {
      type: "key",
      name: String(formData.get("auth_key_name") ?? "").trim(),
      value: String(formData.get("auth_key_value") ?? ""),
      in: inLoc === "cookie" ? "cookie" : "header",
    };
  }
  return { type: "none" };
}

export interface CreateActionState {
  error?: string;
}

/**
 * useActionState-compatible: returns { error } so the modal can surface
 * validation problems inline and stay open. Redirects only on success.
 */
export async function createAction(
  _prev: CreateActionState,
  formData: FormData,
): Promise<CreateActionState> {
  await requireSession();
  const config = await readKratosRaw();
  if ("error" in config) {
    return { error: String(config.error) };
  }
  let patch;
  try {
    patch = addWebHook(config, {
      flow: String(formData.get("flow") ?? ""),
      timing: String(formData.get("timing") ?? "after"),
      method: "all",
      url: String(formData.get("url") ?? "").trim(),
      httpMethod: String(formData.get("http_method") ?? "POST"),
      async: formData.get("async") === "on",
      canInterrupt: formData.get("process_response") === "on",
      body: String(formData.get("body") ?? ""),
      auth: readAuth(formData),
    });
  } catch (err) {
    return { error: (err as Error).message };
  }
  const result = await saveKratosPatches([patch]);
  if (result.error) {
    return { error: result.error };
  }
  flashRedirect(PAGE, result);
}

export async function deleteAction(formData: FormData): Promise<void> {
  await requireSession();
  const config = await readKratosRaw();
  if ("error" in config) {
    flashRedirect(PAGE, { ok: false, error: String(config.error) });
  }
  let patch;
  try {
    const method = String(formData.get("method") ?? "");
    patch = removeWebHook(
      config,
      String(formData.get("flow") ?? ""),
      String(formData.get("timing") ?? ""),
      method === "" ? undefined : method,
      Number(formData.get("index") ?? -1),
    );
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  const result = await saveKratosPatches([patch]);
  flashRedirect(PAGE, result);
}
