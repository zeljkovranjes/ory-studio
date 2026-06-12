"use client";

import { useActionState } from "react";
import { createKeyAction, type CreateKeyState } from "./actions";

export function CreateKeyForm() {
  const [state, formAction, pending] = useActionState<CreateKeyState, FormData>(
    createKeyAction,
    {},
  );

  if (state.token) {
    return (
      <div className="max-w-xl">
        <div className="rounded border border-border bg-accent-subtle px-4 py-3 text-sm text-accent-emphasis">
          API key created — copy it now. It is shown only once.
        </div>
        <pre className="mt-3 overflow-x-auto rounded bg-canvas p-3 font-mono text-xs">
          {state.token}
        </pre>
        <p className="mt-2 text-xs text-fg-subtle">
          Reload the page to return to the key list.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {state.error ? (
        <div className="w-full rounded border border-error-muted bg-error-subtle px-4 py-2.5 text-sm text-error">
          {state.error}
        </div>
      ) : null}
      <label className="text-sm">
        <span className="font-medium">Name</span>
        <input
          name="name"
          placeholder="CI pipeline"
          className="mt-1 block h-10 w-64 rounded border border-border px-3 text-sm focus:border-accent focus:outline-none"
        />
      </label>
      <label className="text-sm">
        <span className="font-medium">Expires</span>
        <select
          name="expires_in_days"
          defaultValue=""
          className="mt-1 block h-10 w-40 rounded border border-border bg-surface px-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="">Never</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded bg-accent px-5 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create API key"}
      </button>
    </form>
  );
}
