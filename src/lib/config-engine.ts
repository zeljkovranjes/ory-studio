/**
 * Config engine — the studio's write path to service configuration.
 *
 * Pure functions mutate YAML text (preserving comments and key order via the
 * yaml Document API) so they are unit-testable; `saveKratosConfig` performs
 * the file write and container reload.
 */

import { readFile, writeFile } from "fs/promises";
import { parseDocument } from "yaml";
import { restartService } from "./docker";
import { firstOplError } from "./opl-validate";
import { currentTenantConfig } from "./tenant";

export interface YamlPatch {
  path: (string | number)[];
  value: unknown;
}

/** Apply generic path patches to YAML text. Pure; preserves comments. */
export function applyYamlPatches(
  yamlText: string,
  patches: YamlPatch[],
): string {
  const doc = parseDocument(yamlText);
  if (doc.errors.length > 0) {
    throw new Error(`Cannot parse config: ${doc.errors[0].message}`);
  }
  for (const patch of patches) {
    if (patch.value === undefined) continue;
    doc.setIn(patch.path, patch.value);
  }
  return doc.toString();
}

export interface KratosAuthPatch {
  registrationEnabled?: boolean;
  passwordEnabled?: boolean;
  codeEnabled?: boolean;
  totpEnabled?: boolean;
  recoveryEnabled?: boolean;
  verificationEnabled?: boolean;
  sessionLifespan?: string;
  privilegedSessionMaxAge?: string;
  cookieSameSite?: "Lax" | "Strict" | "None";
  cookiePersistent?: boolean;
}

const DURATION_PATTERN = /^(\d+h)?(\d+m)?(\d+s)?$/;

export function isValidDuration(value: string): boolean {
  return value.length > 0 && DURATION_PATTERN.test(value);
}

const PATCH_PATHS: Record<keyof KratosAuthPatch, string[]> = {
  registrationEnabled: ["selfservice", "flows", "registration", "enabled"],
  passwordEnabled: ["selfservice", "methods", "password", "enabled"],
  codeEnabled: ["selfservice", "methods", "code", "enabled"],
  totpEnabled: ["selfservice", "methods", "totp", "enabled"],
  recoveryEnabled: ["selfservice", "flows", "recovery", "enabled"],
  verificationEnabled: ["selfservice", "flows", "verification", "enabled"],
  sessionLifespan: ["session", "lifespan"],
  privilegedSessionMaxAge: [
    "selfservice",
    "flows",
    "settings",
    "privileged_session_max_age",
  ],
  cookieSameSite: ["session", "cookie", "same_site"],
  cookiePersistent: ["session", "cookie", "persistent"],
};

/** Apply a patch to kratos.yml text. Pure; preserves comments and formatting. */
export function applyKratosAuthPatch(
  yamlText: string,
  patch: KratosAuthPatch,
): string {
  for (const key of ["sessionLifespan", "privilegedSessionMaxAge"] as const) {
    const value = patch[key];
    if (value !== undefined && !isValidDuration(value)) {
      throw new Error(
        `Invalid duration for ${key}: "${value}" (expected e.g. 1h30m, 72h, 15m)`,
      );
    }
  }
  if (
    patch.cookieSameSite !== undefined &&
    !["Lax", "Strict", "None"].includes(patch.cookieSameSite)
  ) {
    throw new Error(`Invalid SameSite value: "${patch.cookieSameSite}"`);
  }

  const doc = parseDocument(yamlText);
  if (doc.errors.length > 0) {
    throw new Error(`Cannot parse kratos config: ${doc.errors[0].message}`);
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    doc.setIn(PATCH_PATHS[key as keyof KratosAuthPatch], value);
  }
  return doc.toString();
}

export interface SaveResult {
  ok: boolean;
  /** Set when config was written but the service reload failed. */
  warning?: string;
  error?: string;
}

async function writeAndReload(
  configPath: string,
  mutate: (current: string) => string,
  container: string,
): Promise<SaveResult> {
  try {
    const current = await readFile(configPath, "utf8");
    await writeFile(configPath, mutate(current), "utf8");
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  try {
    const { restarted } = await restartService(container);
    if (restarted === 0) {
      return {
        ok: true,
        warning: `Config saved, but no running ${container} container was found to reload.`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: true,
      warning: `Config saved, but reloading ${container} failed: ${(err as Error).message}. Restart it manually.`,
    };
  }
}

export async function saveKratosConfig(
  _configPathIgnored: string,
  patch: KratosAuthPatch,
): Promise<SaveResult> {
  const cfg = await currentTenantConfig();
  return writeAndReload(
    cfg.kratosConfigPath,
    (current) => applyKratosAuthPatch(current, patch),
    cfg.kratosContainer,
  );
}

/** Generic save for any page: path patches against the active tenant's Kratos. */
export async function saveKratosPatches(
  patches: YamlPatch[],
): Promise<SaveResult> {
  const cfg = await currentTenantConfig();
  return writeAndReload(
    cfg.kratosConfigPath,
    (current) => applyYamlPatches(current, patches),
    cfg.kratosContainer,
  );
}

/** Save the Ory Permission Language namespaces file and reload Keto. */
export async function saveKetoNamespaces(
  content: string,
): Promise<SaveResult> {
  // Server-side revalidation — never trust the client to have linted.
  const error = firstOplError(content);
  if (error) {
    return { ok: false, error };
  }
  const cfg = await currentTenantConfig();
  return writeAndReload(cfg.ketoNamespacesPath, () => content, cfg.ketoContainer);
}

/** Generic save for the active tenant's Hydra config file. */
export async function saveHydraPatches(
  patches: YamlPatch[],
): Promise<SaveResult> {
  const cfg = await currentTenantConfig();
  return writeAndReload(
    cfg.hydraConfigPath,
    (current) => applyYamlPatches(current, patches),
    cfg.hydraContainer,
  );
}
