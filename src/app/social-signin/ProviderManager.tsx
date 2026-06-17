"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { deleteOidcProvider, upsertOidcProvider } from "./actions";

interface ProviderMetaLite {
  type: string;
  label: string;
  fields: string[];
}

export interface ProviderView {
  id: string;
  provider: string;
  label?: string;
  client_id: string;
  issuer_url?: string;
  scope?: string[];
  microsoft_tenant?: string;
  subject_source?: string;
  apple_team_id?: string;
  apple_private_key_id?: string;
}

const inputCls =
  "mt-1 block h-9 w-full rounded border border-border px-2 text-sm text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none";

export function ProviderManager({
  providers,
  catalog,
  redirectBase,
}: {
  providers: ProviderView[];
  catalog: ProviderMetaLite[];
  redirectBase: string;
}) {
  // null = closed; { type } = add a new provider of that type; { edit } = edit existing
  const [picking, setPicking] = useState(false);
  const [form, setForm] = useState<
    | { meta: ProviderMetaLite; edit?: ProviderView }
    | null
  >(null);

  const redirectUri = (id: string) =>
    `${redirectBase.replace(/\/$/, "")}/self-service/methods/oidc/callback/${id || "<id>"}`;

  return (
    <div>
      {providers.length === 0 ? (
        <p className="text-sm text-fg-muted">No OpenID Connect providers yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded border border-border">
          {providers.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex-1">
                <span className="font-medium">{p.label || p.id}</span>{" "}
                <Badge tone="muted">
                  {catalog.find((c) => c.type === p.provider)?.label ??
                    p.provider}
                </Badge>
                <span className="block font-mono text-xs text-fg-subtle">
                  {p.id}
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    meta: catalog.find((c) => c.type === p.provider) ?? {
                      type: p.provider,
                      label: p.provider,
                      fields: [],
                    },
                    edit: p,
                  })
                }
                className="text-sm text-fg-muted hover:text-accent"
              >
                Configure
              </button>
              <form action={deleteOidcProvider}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="text-sm text-error hover:underline"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setPicking(true)}
        className="mt-3 h-9 rounded border border-border bg-surface px-4 text-sm font-medium text-fg hover:border-accent hover:text-accent"
      >
        Add new OpenID Connect provider
      </button>

      {/* Step 1: provider catalog picker */}
      {picking ? (
        <Modal title="Add a new OpenID Connect provider" onClose={() => setPicking(false)}>
          <p className="mb-3 text-sm text-fg-muted">
            Select a provider. Anything not listed (Salesforce, Okta, another Ory
            instance, …) uses <strong>Generic</strong> with an issuer URL.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {catalog.map((meta) => (
              <button
                key={meta.type}
                type="button"
                onClick={() => {
                  setPicking(false);
                  setForm({ meta });
                }}
                className="rounded border border-border px-3 py-3 text-left text-sm hover:border-accent hover:text-accent"
              >
                {meta.label}
              </button>
            ))}
          </div>
        </Modal>
      ) : null}

      {/* Step 2: configure form */}
      {form ? (
        <Modal
          title={`Configure ${form.meta.label}`}
          onClose={() => setForm(null)}
        >
          <form action={upsertOidcProvider} className="space-y-3">
            <input type="hidden" name="provider" value={form.meta.type} />
            <input
              type="hidden"
              name="is_edit"
              value={form.edit ? "true" : "false"}
            />

            <Field label="Redirect URI" hint="Add this to the provider's allowed redirect URIs.">
              <code className="block overflow-x-auto rounded bg-canvas px-2 py-1.5 font-mono text-xs">
                {redirectUri(form.edit?.id ?? "")}
              </code>
            </Field>

            <Field label="Provider ID" hint="Unique, URL-safe (letters, digits, - _). Used in the redirect URI.">
              <input
                name="id"
                defaultValue={form.edit?.id ?? ""}
                readOnly={!!form.edit}
                placeholder="google"
                className={`${inputCls} ${form.edit ? "bg-bg-subtle text-fg-muted" : ""}`}
              />
            </Field>

            <Field label="Label" hint="Shown to the user on the sign-in screen.">
              <input
                name="label"
                defaultValue={form.edit?.label ?? form.meta.label}
                className={inputCls}
              />
            </Field>

            <Field label="Client ID">
              <input
                name="client_id"
                defaultValue={form.edit?.client_id ?? ""}
                className={inputCls}
              />
            </Field>

            <Field
              label="Client secret"
              hint={form.edit ? "Leave blank to keep the current secret." : undefined}
            >
              <input
                name="client_secret"
                type="password"
                autoComplete="new-password"
                className={inputCls}
              />
            </Field>

            {form.meta.fields.includes("issuer_url") ? (
              <Field label="Issuer URL" hint="The provider's OIDC issuer / discovery base (https://).">
                <input
                  name="issuer_url"
                  defaultValue={form.edit?.issuer_url ?? ""}
                  placeholder="https://"
                  className={inputCls}
                />
              </Field>
            ) : null}

            {form.meta.fields.includes("microsoft_tenant") ? (
              <Field label="Tenant" hint="Microsoft Azure AD tenant (e.g. 'common', 'organizations', or a tenant ID).">
                <input
                  name="microsoft_tenant"
                  defaultValue={form.edit?.microsoft_tenant ?? ""}
                  className={inputCls}
                />
              </Field>
            ) : null}

            {form.meta.fields.includes("subject_source") ? (
              <Field label="Subject source">
                <select
                  name="subject_source"
                  defaultValue={form.edit?.subject_source ?? "userinfo"}
                  className={inputCls}
                >
                  <option value="userinfo">userinfo</option>
                  <option value="me">me</option>
                </select>
              </Field>
            ) : null}

            {form.meta.fields.includes("apple_team_id") ? (
              <Field label="Apple Team ID">
                <input
                  name="apple_team_id"
                  defaultValue={form.edit?.apple_team_id ?? ""}
                  className={inputCls}
                />
              </Field>
            ) : null}

            {form.meta.fields.includes("apple_private_key_id") ? (
              <Field label="Apple Private Key ID">
                <input
                  name="apple_private_key_id"
                  defaultValue={form.edit?.apple_private_key_id ?? ""}
                  className={inputCls}
                />
              </Field>
            ) : null}

            <Field label="Scopes" hint="Space or comma separated. 'openid' is implied.">
              <input
                name="scope"
                defaultValue={(form.edit?.scope ?? ["email", "profile"]).join(" ")}
                className={`${inputCls} font-mono`}
              />
            </Field>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="h-9 rounded bg-accent px-5 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
              >
                {form.edit ? "Save" : "Add provider"}
              </button>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="h-9 rounded border border-border bg-surface px-4 text-sm font-medium text-fg hover:bg-bg-subtle"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-fg-muted">{hint}</span> : null}
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-6"
      onClick={onClose}
    >
      <div
        className="mt-10 w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-fg-muted hover:text-fg"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
