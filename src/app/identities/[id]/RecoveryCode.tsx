"use client";

import { useActionState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { recoveryCodeAction, type RecoveryCodeState } from "./actions";

/** Generates a recovery code via the admin API and shows it inline (never in the URL). */
export function RecoveryCode({ identityId }: { identityId: string }) {
  const [state, formAction, pending] = useActionState<
    RecoveryCodeState,
    FormData
  >(recoveryCodeAction, {});

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="id" value={identityId} />
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded border border-border bg-surface px-4 text-sm font-medium text-fg hover:bg-bg-subtle disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate recovery code"}
        </button>
      </form>

      {state.error ? (
        <div className="mt-3 rounded border border-error-muted bg-error-subtle px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      ) : null}

      {state.result ? (
        <div className="mt-3 rounded border border-border bg-canvas px-4 py-3 text-sm">
          {state.result.recovery_code ? (
            <div className="flex items-center gap-2">
              <span className="text-fg-muted">Code: </span>
              <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono">
                {state.result.recovery_code}
              </code>
              <CopyButton value={state.result.recovery_code} />
            </div>
          ) : null}
          {state.result.recovery_link ? (
            <div className="mt-1 flex items-center gap-2 break-all">
              <span className="text-fg-muted">Link: </span>
              <code className="flex-1 font-mono text-xs">
                {state.result.recovery_link}
              </code>
              <CopyButton value={state.result.recovery_link} />
            </div>
          ) : null}
          {state.result.expires_at ? (
            <div className="mt-1 text-xs text-fg-subtle">
              Expires {new Date(state.result.expires_at).toLocaleString()}
            </div>
          ) : null}
          <div className="mt-2 text-xs text-fg-subtle">
            Shown once — hand it to the user over a secure channel.
          </div>
        </div>
      ) : null}
    </div>
  );
}
