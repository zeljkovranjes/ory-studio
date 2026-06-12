"use client";

import { useActionState } from "react";
import { createIdentityAction, type CreateIdentityState } from "./actions";

export function CreateIdentityForm({
  schemaIds,
}: {
  schemaIds: string[];
}) {
  const [state, formAction, pending] = useActionState<
    CreateIdentityState,
    FormData
  >(createIdentityAction, {});

  return (
    <form action={formAction} className="max-w-xl">
      {state.error ? (
        <div className="mb-4 rounded border border-error-muted bg-error-subtle px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      ) : null}

      <label className="block py-2 text-sm">
        <span className="font-medium">Identity schema</span>
        <select
          name="schema_id"
          defaultValue={schemaIds[0] ?? "default"}
          className="mt-1 block h-8 w-56 rounded border border-border bg-surface px-2 text-sm text-input-text focus:border-accent focus:outline-none"
        >
          {schemaIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>

      <label className="block py-2 text-sm">
        <span className="font-medium">E-Mail</span>
        <input
          name="email"
          type="email"
          placeholder="user@example.com"
          className="mt-1 block h-8 w-full max-w-md rounded border border-border px-2 text-sm text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none"
        />
      </label>

      <div className="flex gap-4">
        <label className="block py-2 text-sm">
          <span className="font-medium">First name</span>
          <input
            name="first"
            className="mt-1 block h-8 w-44 rounded border border-border px-2 text-sm text-input-text focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block py-2 text-sm">
          <span className="font-medium">Last name</span>
          <input
            name="last"
            className="mt-1 block h-8 w-44 rounded border border-border px-2 text-sm text-input-text focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <label className="block py-2 text-sm">
        <span className="font-medium">Initial password</span>
        <span className="ml-1 text-fg-subtle">(optional)</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Leave blank to create without a password"
          className="mt-1 block h-8 w-full max-w-md rounded border border-border px-2 text-sm text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none"
        />
        <span className="mt-1 block text-xs text-fg-muted">
          Sets a password credential. Kratos enforces your password policy.
        </span>
      </label>

      <details className="py-2">
        <summary className="cursor-pointer text-sm text-fg-muted">
          Advanced: raw traits JSON (overrides the fields above)
        </summary>
        <textarea
          name="raw_traits"
          rows={6}
          placeholder='{"email": "user@example.com"}'
          className="mt-2 block w-full rounded border border-border p-2 font-mono text-xs text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none"
        />
      </details>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 h-8 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create identity"}
      </button>
    </form>
  );
}
