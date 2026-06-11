/**
 * Read access to the Kratos config file — the first half of the config engine.
 * Write + container reload lands with the config-engine milestone.
 */

import { readFile } from "fs/promises";
import { parse } from "yaml";

async function readYamlRaw(
  configPath: string,
): Promise<Record<string, unknown> | { error: string }> {
  try {
    const raw = await readFile(configPath, "utf8");
    return (parse(raw) ?? {}) as Record<string, unknown>;
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/** Parsed kratos.yml as a plain object, or an error sentinel. */
export async function readKratosRaw(
  path?: string,
): Promise<Record<string, unknown> | { error: string }> {
  return readYamlRaw(
    path ?? process.env.KRATOS_CONFIG_PATH ?? "./config/kratos/kratos.yml",
  );
}

/** Parsed hydra.yml as a plain object, or an error sentinel. */
export async function readHydraRaw(
  path?: string,
): Promise<Record<string, unknown> | { error: string }> {
  return readYamlRaw(
    path ?? process.env.HYDRA_CONFIG_PATH ?? "./config/hydra/hydra.yml",
  );
}

/** Safe deep read: getPath(config, ["selfservice","methods","totp","enabled"], false) */
export function getPath<T>(
  source: unknown,
  path: (string | number)[],
  fallback: T,
): T {
  let node: unknown = source;
  for (const key of path) {
    if (node === null || typeof node !== "object") return fallback;
    node = (node as Record<string | number, unknown>)[key];
  }
  return (node as T) ?? fallback;
}

export interface KratosConfigView {
  registrationEnabled: boolean;
  passwordEnabled: boolean;
  codeEnabled: boolean;
  totpEnabled: boolean;
  recoveryEnabled: boolean;
  verificationEnabled: boolean;
  sessionLifespan: string;
  privilegedSessionMaxAge: string;
  cookieSameSite: string;
  cookiePersistent: boolean;
}

export async function readKratosConfig(
  path: string,
): Promise<KratosConfigView | { error: string }> {
  try {
    const raw = await readFile(path, "utf8");
    // Shape is the subset of kratos.yml the General/Sessions pages render.
    const config = parse(raw) as {
      selfservice?: {
        methods?: Record<string, { enabled?: boolean }>;
        flows?: {
          registration?: { enabled?: boolean };
          recovery?: { enabled?: boolean };
          verification?: { enabled?: boolean };
          settings?: { privileged_session_max_age?: string };
        };
      };
      session?: {
        lifespan?: string;
        cookie?: { same_site?: string; persistent?: boolean };
      };
    };
    const methods = config.selfservice?.methods ?? {};
    const flows = config.selfservice?.flows ?? {};
    return {
      registrationEnabled: flows.registration?.enabled ?? true,
      passwordEnabled: methods.password?.enabled ?? false,
      codeEnabled: methods.code?.enabled ?? false,
      totpEnabled: methods.totp?.enabled ?? false,
      recoveryEnabled: flows.recovery?.enabled ?? false,
      verificationEnabled: flows.verification?.enabled ?? false,
      sessionLifespan: config.session?.lifespan ?? "24h",
      privilegedSessionMaxAge:
        flows.settings?.privileged_session_max_age ?? "15m",
      cookieSameSite: config.session?.cookie?.same_site ?? "Lax",
      cookiePersistent: config.session?.cookie?.persistent ?? true,
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
