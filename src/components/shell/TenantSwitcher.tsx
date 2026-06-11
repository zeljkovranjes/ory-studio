"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { switchTenantAction } from "@/app/settings/tenants/actions";

export interface TenantOption {
  slug: string;
  name: string;
}

/** Multi-tenant selector shown in the top bar (replaces single-tenant's none). */
export function TenantSwitcher({
  tenants,
  current,
}: {
  tenants: TenantOption[];
  current?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const activeName =
    tenants.find((t) => t.slug === current)?.name ??
    tenants[0]?.name ??
    "No tenants";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-sm hover:bg-bg-subtle"
      >
        <span className="text-fg-subtle">▦</span>
        <span className="font-medium">{activeName}</span>
        <span className="text-fg-subtle">▾</span>
      </button>
      {open ? (
        <div className="absolute left-0 z-20 mt-1 w-56 rounded-md border border-border bg-surface py-1 shadow-lg">
          {tenants.length === 0 ? (
            <div className="px-3 py-2 text-sm text-fg-muted">
              No tenants registered.
            </div>
          ) : (
            tenants.map((t) => (
              <form key={t.slug} action={switchTenantAction}>
                <input type="hidden" name="slug" value={t.slug} />
                <button
                  type="submit"
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-bg-subtle ${
                    t.slug === current
                      ? "font-medium text-accent-emphasis"
                      : "text-fg"
                  }`}
                >
                  {t.name}
                </button>
              </form>
            ))
          )}
          <div className="my-1 border-t border-border" />
          <Link
            href="/settings/tenants"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-sm text-fg-muted hover:bg-bg-subtle hover:text-fg"
          >
            Manage tenants
          </Link>
        </div>
      ) : null}
    </div>
  );
}
