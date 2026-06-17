"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  activeSidebarHref,
  SECTIONS,
  sectionForPath,
  type NavSection,
} from "@/lib/nav";
import { logoutAction } from "@/app/login/actions";
import { TenantSwitcher, type TenantOption } from "./TenantSwitcher";

export interface TenancyChrome {
  mode: "single" | "multi";
  tenants: TenantOption[];
  current?: string;
}

function TopBar({ tenancy }: { tenancy?: TenancyChrome }) {
  return (
    <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-8">
      <div className="flex items-center gap-3">
        <Link href="/identities" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-xs font-bold text-fg-on-accent">
            O
          </span>
          <span className="text-sm font-semibold">ory-studio</span>
        </Link>
        {tenancy?.mode === "multi" ? (
          <TenantSwitcher
            tenants={tenancy.tenants}
            current={tenancy.current}
          />
        ) : null}
        {process.env.NODE_ENV !== "production" ? (
          <span className="rounded border border-border px-1.5 py-0.5 text-xs text-fg-muted">
            Development
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-5">
        <input
          type="search"
          placeholder="Search..."
          className="h-7 w-56 rounded border border-border bg-canvas px-3 text-sm text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none"
        />
        <a
          href={process.env.NEXT_PUBLIC_ACCOUNT_EXPERIENCE_URL ?? "http://localhost:4455"}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-fg-muted hover:text-fg"
        >
          Account experience ↗
        </a>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-fg-muted hover:text-fg"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function NavTabs({ activeLabel }: { activeLabel?: string }) {
  return (
    <nav className="flex h-9 items-stretch gap-5 border-b border-border bg-surface px-8">
      {SECTIONS.map((section) => {
        const active = section.label === activeLabel;
        return (
          <Link
            key={section.label}
            href={section.href}
            className={`-mb-px flex items-center border-b-2 text-sm ${
              active
                ? "border-accent-emphasis font-medium text-accent-emphasis"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}

function HeaderBand({
  section,
  subLabel,
}: {
  section: NavSection;
  subLabel?: string;
}) {
  return (
    <div className="border-b border-border bg-bg-subtle/40">
      <div className="mx-auto max-w-[1400px] px-8 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{section.label}</h1>
        <div className="mt-2 text-sm">
          <Link href={section.href} className="text-accent hover:underline">
            {section.label}
          </Link>
          {subLabel ? (
            <>
              <span className="px-1.5 text-fg-subtle">/</span>
              <span className="text-fg-muted">{subLabel}</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SideNav({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}) {
  if (section.sidebar.length === 0) return null;
  const activeHref = activeSidebarHref(section.sidebar, pathname);
  return (
    <aside className="w-56 shrink-0 pt-8 pr-6">
      <ul className="space-y-1.5">
        {section.sidebar.map((item) => {
          const active = item.href === activeHref;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block text-sm ${
                  active
                    ? "font-semibold text-fg"
                    : "text-fg-muted hover:text-fg"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export function Chrome({
  children,
  tenancy,
}: {
  children: React.ReactNode;
  tenancy?: TenancyChrome;
}) {
  const pathname = usePathname();

  // The login page renders standalone, without the console chrome.
  if (pathname === "/login") return <>{children}</>;

  const section = sectionForPath(pathname);
  const activeHref = section
    ? activeSidebarHref(section.sidebar, pathname)
    : undefined;
  const subLabel = section?.sidebar.find(
    (item) => item.href === activeHref,
  )?.label;

  return (
    <div className="min-h-screen">
      <TopBar tenancy={tenancy} />
      <NavTabs activeLabel={section?.label} />
      {section ? <HeaderBand section={section} subLabel={subLabel} /> : null}
      <div className="mx-auto flex max-w-[1400px] px-8">
        {section ? <SideNav section={section} pathname={pathname} /> : null}
        <main className="min-w-0 flex-1 py-8">{children}</main>
      </div>
    </div>
  );
}
