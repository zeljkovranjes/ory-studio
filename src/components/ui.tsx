/** Small shared building blocks for console pages. */

import { formatRelativeTime } from "@/lib/time";

/**
 * Render a timestamp as compact relative time ("5m ago") with the full local
 * time as a hover tooltip. Server-rendered, so no hydration concerns.
 */
export function RelativeTime({ iso }: { iso: string }) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return <span>—</span>;
  return (
    <span title={date.toLocaleString()}>
      {formatRelativeTime(iso, Date.now())}
    </span>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="text-base font-medium">{title}</h1>
      {description ? (
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{description}</p>
      ) : null}
    </header>
  );
}

export function Card({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-lg border border-border bg-surface p-6">
      {title ? <h2 className="text-base font-medium">{title}</h2> : null}
      {description ? (
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{description}</p>
      ) : null}
      <div className={title || description ? "mt-5" : undefined}>{children}</div>
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded border border-dashed border-border px-4 py-12 text-center text-sm text-fg-subtle">
      {message}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded border border-error-muted bg-error-subtle px-4 py-3 text-sm text-error">
      {message}
    </div>
  );
}

export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-fg-subtle">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
}) {
  const body = (
    <div className="rounded border border-border px-6 py-4">
      <div className="text-sm text-fg-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
  return href ? <a href={href} className="block hover:border-accent">{body}</a> : body;
}

const AVATAR_COLORS = [
  "#3d53f5",
  "#18a957",
  "#df1642",
  "#6475f7",
  "#9c0f2e",
] as const;

export function Avatar({ seed, label }: { seed: string; label: string }) {
  // Deterministic color from the seed; initial from the label.
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  const initial = (label.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-fg-on-accent"
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "success" | "muted" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    success: "bg-accent-subtle text-success-emphasis",
    muted: "bg-bg-subtle text-fg-muted",
    error: "bg-error-subtle text-error",
  } as const;
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
