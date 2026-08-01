"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAnchoredMenu } from "./use-anchored-menu";
import { ConfirmDialog } from "./ConfirmDialog";

export interface RowMenuItem {
  label: string;
  href?: string;
  /** Server action for destructive items rendered as a form button. */
  action?: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string, string>;
  danger?: boolean;
  /** When set, the action runs only after this is confirmed in a modal. */
  confirm?: string;
  /** Verb for the modal's confirm button while the action runs. */
  confirmPendingLabel?: string;
}

/**
 * Console-style row options menu (⋮) with a click-away dropdown. The dropdown
 * is rendered in a portal with fixed positioning so it floats above the page
 * instead of being clipped by an `overflow` ancestor (e.g. the table's
 * `overflow-x-auto` wrapper, which would otherwise show a scrollbar).
 */
export function RowMenu({ items }: { items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<RowMenuItem | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const cancelConfirm = useCallback(() => setConfirming(null), []);
  const { btnRef, menuRef, rect } = useAnchoredMenu(open, close);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Row options"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded text-fg-muted hover:bg-bg-subtle hover:text-fg"
      >
        <span className="text-lg leading-none">⋮</span>
      </button>
      {open && rect
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right,
              }}
              className="z-50 w-44 rounded-md border border-border bg-surface py-1 shadow-lg"
            >
              {items.map((item) => {
                const itemClass = `block w-full px-3 py-1.5 text-left text-sm hover:bg-bg-subtle ${
                  item.danger ? "text-error" : "text-fg"
                }`;
                if (item.href) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block px-3 py-1.5 text-sm text-fg hover:bg-bg-subtle"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                }
                // Confirmable items hand off to the modal instead of submitting.
                if (item.confirm) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={itemClass}
                      onClick={() => {
                        setOpen(false);
                        setConfirming(item);
                      }}
                    >
                      {item.label}
                    </button>
                  );
                }
                return (
                  <form key={item.label} action={item.action}>
                    {Object.entries(item.hiddenFields ?? {}).map(([k, v]) => (
                      <input key={k} type="hidden" name={k} value={v} />
                    ))}
                    <button
                      type="submit"
                      className={itemClass}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </button>
                  </form>
                );
              })}
            </div>,
            document.body,
          )
        : null}
      {confirming?.action ? (
        <ConfirmDialog
          action={confirming.action}
          hiddenFields={confirming.hiddenFields}
          title={confirming.label}
          message={confirming.confirm}
          confirmLabel={confirming.label}
          pendingLabel={confirming.confirmPendingLabel}
          onCancel={cancelConfirm}
        />
      ) : null}
    </>
  );
}
