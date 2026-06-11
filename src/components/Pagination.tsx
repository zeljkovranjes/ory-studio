import Link from "next/link";

/**
 * Token-based pagination bar matching the console layout:
 * "Items per page [N] · <range> · prev next".
 * Lists here use opaque page tokens, so prev/next are link hrefs (null = disabled).
 */
export function Pagination({
  rangeLabel,
  prevHref,
  nextHref,
  pageSize,
}: {
  rangeLabel?: string;
  prevHref?: string | null;
  nextHref?: string | null;
  pageSize?: number;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-4 text-sm text-fg-muted">
      {pageSize ? (
        <span className="flex items-center gap-2">
          Items per page
          <span className="rounded border border-border px-2 py-0.5 text-fg">
            {pageSize}
          </span>
        </span>
      ) : null}
      {rangeLabel ? <span>{rangeLabel}</span> : null}
      <div className="flex items-center gap-1">
        <PageArrow href={prevHref} dir="prev" />
        <PageArrow href={nextHref} dir="next" />
      </div>
    </div>
  );
}

function PageArrow({
  href,
  dir,
}: {
  href?: string | null;
  dir: "prev" | "next";
}) {
  const glyph = dir === "prev" ? "‹" : "›";
  const base =
    "flex h-7 w-7 items-center justify-center rounded border border-border";
  if (!href) {
    return (
      <span className={`${base} text-fg-disabled`} aria-disabled>
        {glyph}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} text-fg-muted hover:border-accent hover:text-accent`}
      aria-label={dir === "prev" ? "Previous page" : "Next page"}
    >
      {glyph}
    </Link>
  );
}
