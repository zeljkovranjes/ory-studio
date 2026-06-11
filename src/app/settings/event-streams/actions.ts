"use server";

import { requireSession } from "@/lib/require-session";

import {
  createEventStream,
  deleteEventStream,
  setEventStreamEnabled,
} from "@/lib/event-streams";
import { currentTenant } from "@/lib/tenant";
import { flashRedirect } from "@/lib/flash";

const PAGE = "/settings/event-streams";

export async function createStreamAction(formData: FormData): Promise<void> {
  await requireSession();
  const tenant = await currentTenant();
  try {
    await createEventStream(tenant.id, {
      name: String(formData.get("name") ?? "").trim(),
      type: String(formData.get("type") ?? "https"),
      url: String(formData.get("url") ?? "").trim(),
    });
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}

export async function toggleStreamAction(formData: FormData): Promise<void> {
  await requireSession();
  const tenant = await currentTenant();
  try {
    await setEventStreamEnabled(
      tenant.id,
      String(formData.get("id") ?? ""),
      formData.get("enabled") === "true",
    );
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}

export async function deleteStreamAction(formData: FormData): Promise<void> {
  await requireSession();
  const tenant = await currentTenant();
  try {
    await deleteEventStream(tenant.id, String(formData.get("id") ?? ""));
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}
