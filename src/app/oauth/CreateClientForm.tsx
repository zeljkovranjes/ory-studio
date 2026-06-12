"use client";

import { useActionState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { createClientAction, type CreateClientState } from "./actions";

const GRANT_TYPES = [
  "authorization_code",
  "refresh_token",
  "client_credentials",
  "implicit",
];
const RESPONSE_TYPES = ["code", "token", "id_token"];

export function CreateClientForm() {
  const [state, formAction, pending] = useActionState<
    CreateClientState,
    FormData
  >(createClientAction, {});

  if (state.client) {
    return (
      <div className="max-w-xl">
        <div className="rounded border border-border bg-accent-subtle px-4 py-3 text-sm text-accent-emphasis">
          Client created.
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
          The secret is shown only once — store it now. Reload the page to see
          the client in the list.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-xl">
      {state.error ? (
        <div className="mb-4 rounded border border-error-muted bg-error-subtle px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      ) : null}

      <label className="block py-2 text-sm">
        <span className="font-medium">Client name</span>
        <input
          name="client_name"
          placeholder="My Web App"
          className="mt-1 block h-8 w-full max-w-md rounded border border-border px-2 text-sm text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none"
        />
      </label>

      <fieldset className="py-2 text-sm">
        <legend className="font-medium">Grant types</legend>
        <div className="mt-1 flex flex-wrap gap-4">
          {GRANT_TYPES.map((grant) => (
            <label key={grant} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                name="grant_types"
                value={grant}
                defaultChecked={grant === "authorization_code"}
                className="h-4 w-4 accent-(--color-accent)"
              />
              <span className="font-mono text-xs">{grant}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="py-2 text-sm">
        <legend className="font-medium">Response types</legend>
        <div className="mt-1 flex flex-wrap gap-4">
          {RESPONSE_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                name="response_types"
                value={type}
                defaultChecked={type === "code"}
                className="h-4 w-4 accent-(--color-accent)"
              />
              <span className="font-mono text-xs">{type}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block py-2 text-sm">
        <span className="font-medium">Redirect URIs</span>
        <textarea
          name="redirect_uris"
          rows={3}
          placeholder={"https://app.example.com/callback\nmyapp://callback"}
          className="mt-1 block w-full rounded border border-border p-2 font-mono text-xs text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none"
        />
        <span className="mt-1 block text-fg-muted">One URI per line</span>
      </label>

      <label className="block py-2 text-sm">
        <span className="font-medium">Scope</span>
        <input
          name="scope"
          placeholder="openid offline_access email"
          className="mt-1 block h-8 w-full max-w-md rounded border border-border px-2 font-mono text-xs text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none"
        />
      </label>

      <label className="block py-2 text-sm">
        <span className="font-medium">Token endpoint auth method</span>
        <select
          name="auth_method"
          defaultValue="client_secret_basic"
          className="mt-1 block h-8 w-64 rounded border border-border bg-surface px-2 text-sm text-input-text focus:border-accent focus:outline-none"
        >
          <option value="client_secret_basic">client_secret_basic</option>
          <option value="client_secret_post">client_secret_post</option>
          <option value="none">none (public client)</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 h-8 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create client"}
      </button>
    </form>
  );
}
