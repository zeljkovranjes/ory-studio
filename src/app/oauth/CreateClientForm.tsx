"use client";

import { useActionState, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { CLIENT_TEMPLATES, type ClientTemplate } from "@/lib/oauth-templates";
import { createClientAction, type CreateClientState } from "./actions";

const GRANT_TYPES = [
  "authorization_code",
  "refresh_token",
  "client_credentials",
  "implicit",
];
const RESPONSE_TYPES = ["code", "token", "id_token"];
const inputCls =
  "mt-1 block h-9 w-full max-w-md rounded border border-border px-2 text-sm text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none";

export function CreateClientForm() {
  const [state, formAction, pending] = useActionState<CreateClientState, FormData>(
    createClientAction,
    {},
  );
  const [template, setTemplate] = useState<ClientTemplate | null>(null);
  const [advanced, setAdvanced] = useState(false);

  // Success: show the credentials once.
  if (state.client) {
    return (
      <div className="max-w-xl">
        <div className="rounded border border-border bg-accent-subtle px-4 py-3 text-sm text-accent-emphasis">
          Client created — the secret is shown only once.
        </div>
        <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-fg-muted">Client ID</dt>
          <dd className="flex items-center gap-2">
            <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">
              {state.client.client_id}
            </code>
            <CopyButton value={state.client.client_id} />
          </dd>
          {state.client.client_secret ? (
            <>
              <dt className="text-fg-muted">Client Secret</dt>
              <dd className="flex items-center gap-2">
                <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">
                  {state.client.client_secret}
                </code>
                <CopyButton value={state.client.client_secret} />
              </dd>
            </>
          ) : null}
        </dl>
        <p className="mt-3 text-xs text-fg-subtle">
          Reload the page to see the client in the list.
        </p>
      </div>
    );
  }

  // Step 1: template picker.
  if (!template) {
    return (
      <div>
        <p className="mb-3 text-sm text-fg-muted">
          Select the template of OAuth2 client you want to create.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CLIENT_TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTemplate(t)}
              className="rounded border border-border px-4 py-3 text-left hover:border-accent"
            >
              <span className="block text-sm font-medium">{t.label}</span>
              <span className="mt-0.5 block text-xs text-fg-muted">
                {t.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: the form, seeded by the chosen template.
  return (
    <form action={formAction} className="max-w-xl space-y-3">
      {state.error ? (
        <div className="rounded border border-error-muted bg-error-subtle px-4 py-2.5 text-sm text-error">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <span>
          Template: <span className="font-medium text-fg">{template.label}</span>
        </span>
        <button
          type="button"
          onClick={() => setTemplate(null)}
          className="text-accent hover:underline"
        >
          change
        </button>
      </div>

      <label className="block text-sm">
        <span className="font-medium">Client name</span>
        <input name="client_name" placeholder="My Web App" className={inputCls} />
      </label>

      <label className="block text-sm">
        <span className="font-medium">Scope</span>
        <input
          name="scope"
          defaultValue="openid offline_access"
          className={`${inputCls} font-mono`}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">Redirect URIs</span>
        <textarea
          name="redirect_uris"
          rows={2}
          placeholder={"https://app.example.com/callback"}
          className="mt-1 block w-full rounded border border-border p-2 font-mono text-xs focus:border-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-fg-muted">One URI per line.</span>
      </label>

      <fieldset className="text-sm">
        <legend className="font-medium">Grant types</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {GRANT_TYPES.map((g) => (
            <label key={g} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                name="grant_types"
                value={g}
                defaultChecked={template.grant_types.includes(g)}
                className="h-4 w-4 accent-(--color-accent)"
              />
              <span className="font-mono text-xs">{g}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="text-sm">
        <legend className="font-medium">Response types</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {RESPONSE_TYPES.map((r) => (
            <label key={r} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                name="response_types"
                value={r}
                defaultChecked={template.response_types.includes(r)}
                className="h-4 w-4 accent-(--color-accent)"
              />
              <span className="font-mono text-xs">{r}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm">
        <span className="font-medium">Authentication method</span>
        <select
          name="auth_method"
          defaultValue={template.token_endpoint_auth_method}
          className="mt-1 block h-9 w-64 rounded border border-border bg-surface px-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="client_secret_basic">HTTP Basic</option>
          <option value="client_secret_post">Request body</option>
          <option value="none">None (public client)</option>
          <option value="private_key_jwt">private_key_jwt</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="skip_consent" className="h-4 w-4 accent-(--color-accent)" />
        <span>Skip consent screen</span>
      </label>

      <button
        type="button"
        onClick={() => setAdvanced((v) => !v)}
        className="text-sm font-medium text-fg-muted hover:text-fg"
      >
        {advanced ? "Hide advanced settings" : "Show advanced settings"}
      </button>

      {advanced ? (
        <div className="space-y-3 rounded border border-border p-3">
          <Text name="post_logout_redirect_uris" label="Post-logout redirect URIs" area placeholder="https://app.example.com/" hint="One per line." />
          <Text name="backchannel_logout_uri" label="Backchannel logout URI" />
          <Text name="frontchannel_logout_uri" label="Frontchannel logout URI" />
          <Text name="allowed_cors_origins" label="Allowed CORS origins" area placeholder="https://app.example.com" hint="One per line." />
          <Text name="audience" label="Audience" area hint="One per line." />
          <Text name="jwks_uri" label="JWKS URI" />
          <Text name="client_uri" label="Client URI" />
          <Text name="policy_uri" label="Policy URI" />
          <Text name="tos_uri" label="Terms of Service URI" />
          <Text name="contacts" label="Contacts" area hint="One email per line." />
          <label className="block text-sm">
            <span className="font-medium">Metadata</span>
            <textarea
              name="metadata"
              rows={3}
              placeholder='{ "owner": "team-a" }'
              className="mt-1 block w-full rounded border border-border p-2 font-mono text-xs focus:border-accent focus:outline-none"
            />
            <span className="mt-1 block text-xs text-fg-muted">
              Public JSON metadata stored on the client.
            </span>
          </label>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded bg-accent px-5 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create client"}
      </button>
    </form>
  );
}

function Text({
  name,
  label,
  area,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  area?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {area ? (
        <textarea
          name={name}
          rows={2}
          placeholder={placeholder ?? "https://"}
          className="mt-1 block w-full rounded border border-border p-2 font-mono text-xs focus:border-accent focus:outline-none"
        />
      ) : (
        <input name={name} placeholder={placeholder ?? "https://"} className={inputCls} />
      )}
      {hint ? <span className="mt-1 block text-xs text-fg-muted">{hint}</span> : null}
    </label>
  );
}
