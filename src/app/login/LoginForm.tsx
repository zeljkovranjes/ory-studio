"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.error ? (
        <div className="rounded border border-error-muted bg-error-subtle px-3 py-2 text-sm text-error">
          {state.error}
        </div>
      ) : null}
      <label className="block text-sm">
        <span className="font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          className="mt-1.5 block h-10 w-full rounded border border-border px-3 text-sm text-input-text focus:border-accent focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-10 w-full rounded bg-accent text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
