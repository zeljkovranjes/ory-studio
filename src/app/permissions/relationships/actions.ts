"use server";

import { requireSession } from "@/lib/require-session";

import { createRelationship, deleteRelationship } from "@/lib/keto";
import { flashRedirect } from "@/lib/flash";
import { currentTenant } from "@/lib/tenant";

const PAGE = "/permissions/relationships";

const NAME_PATTERN = /^[A-Za-z0-9_:@.\/-]{1,128}$/;

export async function addRelationship(formData: FormData): Promise<void> {
  await requireSession();
  const namespace = String(formData.get("namespace") ?? "").trim();
  const object = String(formData.get("object") ?? "").trim();
  const relation = String(formData.get("relation") ?? "").trim();
  const subjectId = String(formData.get("subject_id") ?? "").trim();
  for (const [label, value] of [
    ["Namespace", namespace],
    ["Object", object],
    ["Relation", relation],
    ["Subject", subjectId],
  ] as const) {
    if (!NAME_PATTERN.test(value)) {
      flashRedirect(PAGE, {
        ok: false,
        error: `${label} is required and may only contain letters, digits, and _ : @ . / -`,
      });
    }
  }
  try {
    await createRelationship(await currentTenant(), {
      namespace,
      object,
      relation,
      subject_id: subjectId,
    });
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}

export async function removeRelationship(formData: FormData): Promise<void> {
  await requireSession();
  try {
    await deleteRelationship(await currentTenant(), {
      namespace: String(formData.get("namespace") ?? ""),
      object: String(formData.get("object") ?? ""),
      relation: String(formData.get("relation") ?? ""),
      subject_id: String(formData.get("subject_id") ?? ""),
    });
  } catch (err) {
    flashRedirect(PAGE, { ok: false, error: (err as Error).message });
  }
  flashRedirect(PAGE, { ok: true });
}
