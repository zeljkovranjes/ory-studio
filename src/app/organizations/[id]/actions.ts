"use server";

import { requireSession } from "@/lib/require-session";

import { createRelationship, deleteRelationship } from "@/lib/keto";
import {
  ORG_NAMESPACE,
  ORG_RELATIONS,
  orgObjectKey,
} from "@/lib/organizations";
import {
  createConnection,
  deleteSamlConnection,
  type SsoProtocol,
} from "@/lib/saml";
import { currentTenant } from "@/lib/tenant";
import { flashRedirect } from "@/lib/flash";

function page(id: string): string {
  return `/organizations/${encodeURIComponent(id)}`;
}

const SUBJECT_RE = /^[A-Za-z0-9_:@.\/-]{1,128}$/;

export async function addMemberAction(formData: FormData): Promise<void> {
  await requireSession();
  const orgId = String(formData.get("org_id") ?? "");
  const subject = String(formData.get("subject_id") ?? "").trim();
  const relation = String(formData.get("relation") ?? "members");

  if (!SUBJECT_RE.test(subject)) {
    flashRedirect(page(orgId), {
      ok: false,
      error: "Subject (identity id) is required and must be a valid identifier",
    });
  }
  if (!(ORG_RELATIONS as readonly string[]).includes(relation)) {
    flashRedirect(page(orgId), { ok: false, error: "Unknown role" });
  }

  try {
    await createRelationship(await currentTenant(), {
      namespace: ORG_NAMESPACE,
      object: orgObjectKey(orgId),
      relation,
      subject_id: subject,
    });
  } catch (err) {
    flashRedirect(page(orgId), { ok: false, error: (err as Error).message });
  }
  flashRedirect(page(orgId), { ok: true });
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  await requireSession();
  const orgId = String(formData.get("org_id") ?? "");
  try {
    await deleteRelationship(await currentTenant(), {
      namespace: ORG_NAMESPACE,
      object: orgObjectKey(orgId),
      relation: String(formData.get("relation") ?? "members"),
      subject_id: String(formData.get("subject_id") ?? ""),
    });
  } catch (err) {
    flashRedirect(page(orgId), { ok: false, error: (err as Error).message });
  }
  flashRedirect(page(orgId), { ok: true });
}

export async function addOrgSsoAction(formData: FormData): Promise<void> {
  await requireSession();
  const orgId = String(formData.get("org_id") ?? "");
  const tenant = await currentTenant();
  const protocol = (
    String(formData.get("protocol") ?? "saml") === "oidc" ? "oidc" : "saml"
  ) as SsoProtocol;
  try {
    await createConnection(tenant.id, {
      protocol,
      orgId,
      name: String(formData.get("name") ?? "").trim(),
      idpMetadataUrl: String(formData.get("idp_metadata_url") ?? "").trim(),
      idpEntityId: String(formData.get("idp_entity_id") ?? "").trim(),
      oidcIssuerUrl: String(formData.get("oidc_issuer_url") ?? "").trim(),
      oidcClientId: String(formData.get("oidc_client_id") ?? "").trim(),
      oidcClientSecret: String(formData.get("oidc_client_secret") ?? ""),
    });
  } catch (err) {
    flashRedirect(page(orgId), { ok: false, error: (err as Error).message });
  }
  flashRedirect(page(orgId), { ok: true });
}

export async function removeOrgSsoAction(formData: FormData): Promise<void> {
  await requireSession();
  const orgId = String(formData.get("org_id") ?? "");
  try {
    await deleteSamlConnection(
      (await currentTenant()).id,
      String(formData.get("id") ?? ""),
    );
  } catch (err) {
    flashRedirect(page(orgId), { ok: false, error: (err as Error).message });
  }
  flashRedirect(page(orgId), { ok: true });
}
