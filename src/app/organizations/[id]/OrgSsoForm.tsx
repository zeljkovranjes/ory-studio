"use client";

import { useState } from "react";
import { addOrgSsoAction } from "./actions";

/** Add an org-scoped SSO connection — SAML or OIDC, with conditional fields. */
export function OrgSsoForm({ orgId }: { orgId: string }) {
  const [protocol, setProtocol] = useState<"saml" | "oidc">("saml");

  return (
    <form
      action={addOrgSsoAction}
      className="mt-4 space-y-3 border-t border-border pt-4"
    >
      <input type="hidden" name="org_id" value={orgId} />

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Protocol</span>
        <div className="inline-flex rounded border border-border p-0.5">
          {(["saml", "oidc"] as const).map((p) => (
            <label
              key={p}
              className={`cursor-pointer rounded px-3 py-1 text-sm uppercase ${
                protocol === p
                  ? "bg-accent-subtle font-medium text-accent-emphasis"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <input
                type="radio"
                name="protocol"
                value={p}
                checked={protocol === p}
                onChange={() => setProtocol(p)}
                className="sr-only"
              />
              {p}
            </label>
          ))}
        </div>
      </div>

      <label className="block text-sm">
        <span className="font-medium">Connection name</span>
        <input
          name="name"
          placeholder={protocol === "saml" ? "Acme Okta" : "Acme Google"}
          className="mt-1 block h-10 w-full max-w-md rounded border border-border px-3 text-sm focus:border-accent focus:outline-none"
        />
      </label>

      {protocol === "saml" ? (
        <div className="flex flex-wrap gap-3">
          <label className="block text-sm">
            <span className="font-medium">IdP metadata URL</span>
            <input
              name="idp_metadata_url"
              placeholder="https://idp.acme.com/metadata"
              className="mt-1 block h-10 w-80 rounded border border-border px-3 font-mono text-xs focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Entity ID (optional)</span>
            <input
              name="idp_entity_id"
              className="mt-1 block h-10 w-64 rounded border border-border px-3 font-mono text-xs focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <label className="block text-sm">
            <span className="font-medium">Issuer URL</span>
            <input
              name="oidc_issuer_url"
              placeholder="https://accounts.acme.com"
              className="mt-1 block h-10 w-72 rounded border border-border px-3 font-mono text-xs focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Client ID</span>
            <input
              name="oidc_client_id"
              className="mt-1 block h-10 w-56 rounded border border-border px-3 font-mono text-xs focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Client secret</span>
            <input
              name="oidc_client_secret"
              type="password"
              className="mt-1 block h-10 w-56 rounded border border-border px-3 font-mono text-xs focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      )}

      <button
        type="submit"
        className="h-10 rounded bg-accent px-5 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
      >
        Add connection
      </button>
    </form>
  );
}
