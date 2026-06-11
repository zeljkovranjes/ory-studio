"use server";

import { saveTheme, type ThemeTokens } from "@/lib/theme";
import { currentTenant } from "@/lib/tenant";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/account-experience/theming";

export async function saveThemeAction(formData: FormData): Promise<void> {
  const tenant = await currentTenant();
  const tokens: ThemeTokens = {
    accent: String(formData.get("accent") ?? ""),
    accentEmphasis: String(formData.get("accentEmphasis") ?? ""),
    accentSubtle: String(formData.get("accentSubtle") ?? ""),
    foreground: String(formData.get("foreground") ?? ""),
    surface: String(formData.get("surface") ?? ""),
    border: String(formData.get("border") ?? ""),
    error: String(formData.get("error") ?? ""),
  };
  try {
    await saveTheme(tenant.id, tokens);
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}
