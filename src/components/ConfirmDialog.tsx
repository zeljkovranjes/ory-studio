"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";

export interface ConfirmDialogProps {
  /** Server action run only after the user confirms. */
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string, string>;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  onCancel: () => void;
}

/**
 * Modal confirmation for a destructive server action. Rendered in a portal so
 * it floats above the page; the caller mounts it only while it should be shown.
 * Escape, the backdrop and Cancel all dismiss it without running the action.
 */
export function ConfirmDialog({
  action,
  hiddenFields,
  title,
  message,
  confirmLabel,
  pendingLabel,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus Cancel rather than Confirm so a stray Enter can't destroy anything.
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="mt-24 w-full max-w-md rounded-lg border border-border bg-surface shadow-xl"
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <div className="px-6 py-5 text-sm text-fg-muted">{message}</div>
        <form action={action}>
          {Object.entries(hiddenFields ?? {}).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="h-9 rounded border border-border px-4 text-sm font-medium text-fg hover:bg-bg-subtle"
            >
              Cancel
            </button>
            <ConfirmSubmit
              label={confirmLabel}
              pendingLabel={pendingLabel ?? "Working…"}
            />
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function ConfirmSubmit({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-9 rounded bg-error-emphasis px-4 text-sm font-medium text-fg-on-accent hover:bg-error disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/** Destructive button that opens a {@link ConfirmDialog} instead of submitting. */
export function ConfirmButton({
  className,
  children,
  ...dialog
}: Omit<ConfirmDialogProps, "onCancel"> & {
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open ? <ConfirmDialog {...dialog} onCancel={() => setOpen(false)} /> : null}
    </>
  );
}
