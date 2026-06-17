"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAnchoredMenu } from "./use-anchored-menu";

export interface RowMenuItem {
  label: string;
  href?: string;
  /** Server action for destructive items rendered as a form button. */
  action?: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string, string>;
  danger?: boolean;
  confirm?: string;
}

/**
 * Console-style row options menu (⋮) with a click-away dropdown. The dropdown
 * is rendered in a portal with fixed positioning so it floats above the page
 * instead of being clipped by an `overflow` ancestor (e.g. the table's
 * `overflow-x-auto` wrapper, which would otherwise show a scrollbar).
 */
export function RowMenu({ items }: { items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
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
              {items.map((item) =>
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block px-3 py-1.5 text-sm text-fg hover:bg-bg-subtle"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <form
                    key={item.label}
                    action={item.action}
                    onSubmit={(e) => {
                      if (item.confirm && !window.confirm(item.confirm)) {
                        e.preventDefault();
                      } else {
                        setOpen(false);
                      }
                    }}
                  >
                    {Object.entries(item.hiddenFields ?? {}).map(([k, v]) => (
                      <input key={k} type="hidden" name={k} value={v} />
                    ))}
                    <button
                      type="submit"
                      className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-bg-subtle ${
                        item.danger ? "text-error" : "text-fg"
                      }`}
                    >
                      {item.label}
                    </button>
                  </form>
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
