"use client";

import { useActionState, useState } from "react";
import { updateMetadataAction, type EditMetadataState } from "./actions";

export function MetadataEditor({
  identityId,
  field,
  value,
}: {
  identityId: string;
  field: "metadata_admin" | "metadata_public";
  value: unknown;
}) {
  const initial =
    value === null || value === undefined ? "" : JSON.stringify(value, null, 2);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial);
  const [state, formAction, pending] = useActionState<
    EditMetadataState,
    FormData
  >(updateMetadataAction, {});

  if (!open) {
    return (
      <div>
        {initial ? (
          <pre className="overflow-x-auto rounded bg-canvas p-3 font-mono text-xs">
            {initial}
          </pre>
        ) : (
          <p className="text-sm text-fg-muted">No metadata set.</p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 h-8 rounded border border-border bg-surface px-4 text-sm font-medium text-fg hover:bg-bg-subtle"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={identityId} />
      <input type="hidden" name="field" value={field} />
      {state.error ? (
        <div className="mb-3 rounded border border-error-muted bg-error-subtle px-3 py-2 text-sm text-error">
          {state.error}
        </div>
      ) : null}
      <textarea
        name="value"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.min(16, Math.max(4, initial.split("\n").length + 1))}
        spellCheck={false}
        placeholder="{ }  — leave empty to clear"
        className="block w-full rounded border border-border bg-canvas p-3 font-mono text-xs focus:border-accent focus:outline-none"
      />
      <p className="mt-1 text-xs text-fg-muted">
        Arbitrary JSON. Leave empty to clear.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setText(initial);
            setOpen(false);
          }}
          className="h-8 rounded border border-border bg-surface px-4 text-sm font-medium text-fg hover:bg-bg-subtle"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
