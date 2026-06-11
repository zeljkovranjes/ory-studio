"use client";

import { useActionState } from "react";
import { importIdentitiesAction, type ImportState } from "./actions";

export function ImportForm({ schemaIds }: { schemaIds: string[] }) {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importIdentitiesAction,
    {},
  );

  return (
    <div className="max-w-2xl">
      {state.error ? (
        <div className="mb-4 rounded border border-error-muted bg-error-subtle px-4 py-2.5 text-sm text-error">
          {state.error}
        </div>
      ) : null}

      {state.created !== undefined ? (
        <div className="mb-4 rounded border border-border bg-canvas px-4 py-3 text-sm">
          <div className="font-medium text-success-emphasis">
            Imported {state.created}{" "}
            {state.created === 1 ? "identity" : "identities"}.
          </div>
          {state.failed && state.failed.length > 0 ? (
            <div className="mt-2">
              <div className="text-error">
                {state.failed.length} failed:
              </div>
              <ul className="mt-1 space-y-0.5">
                {state.failed.map((f, i) => (
                  <li key={i} className="font-mono text-xs text-fg-muted">
                    {f.email}: {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <form action={formAction} className="space-y-3">
        <label className="block text-sm">
          <span className="font-medium">Identity schema</span>
          <select
            name="schema_id"
            defaultValue={schemaIds[0] ?? "default"}
            className="mt-1 block h-10 w-56 rounded border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none"
          >
            {schemaIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">CSV</span>
          <textarea
            name="csv"
            rows={10}
            placeholder={"email,first,last\njane@example.com,Jane,Doe\njohn@example.com,John,Roe"}
            className="mt-1 block w-full rounded border border-border bg-canvas p-3 font-mono text-xs focus:border-accent focus:outline-none"
          />
          <span className="mt-1 block text-fg-muted">
            First row must be a header with an <code>email</code> column;{" "}
            <code>first</code> and <code>last</code> are optional.
          </span>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded bg-accent px-5 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis disabled:opacity-60"
        >
          {pending ? "Importing…" : "Import identities"}
        </button>
      </form>
    </div>
  );
}
