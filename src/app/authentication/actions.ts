"use server";

import { requireSession } from "@/lib/require-session";

import { saveKratosConfig, type KratosAuthPatch } from "@/lib/config-engine";
import { flashRedirect } from "@/lib/flash";

function configPath(): string {
  return process.env.KRATOS_CONFIG_PATH ?? "./config/kratos/kratos.yml";
}

function checkbox(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

async function save(patch: KratosAuthPatch): Promise<never> {
  const result = await saveKratosConfig(configPath(), patch);
  flashRedirect("/authentication", result);
}

export async function saveSignupLogin(formData: FormData): Promise<void> {
  await requireSession();
  await save({
    registrationEnabled: checkbox(formData, "registration"),
    passwordEnabled: checkbox(formData, "password"),
    codeEnabled: checkbox(formData, "code"),
    totpEnabled: checkbox(formData, "totp"),
  });
}

export async function saveRecoveryVerification(
  formData: FormData,
): Promise<void> {
  await requireSession();
  await save({
    recoveryEnabled: checkbox(formData, "recovery"),
    verificationEnabled: checkbox(formData, "verification"),
  });
}
