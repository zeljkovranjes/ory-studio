"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface RowMenuItem {
  label: string;
  href?: string;
  /** Server action for destructive items rendered as a form button. */
  action?: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string, string>;
  danger?: boolean;
  confirm?: string;
}

/** Console-style row options menu (⋮) with a click-away dropdown. */
export function RowMenu({ items }: { items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        aria-label="Row options"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded text-fg-muted hover:bg-bg-subtle hover:text-fg"
      >
        <span className="text-lg leading-none">⋮</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-border bg-surface py-1 shadow-lg">
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
        </div>
      ) : null}
    </div>
  );
}
