"use client";

import { useState } from "react";

/**
 * Copy a value to the clipboard with brief "Copied!" feedback. Used for
 * one-time secrets (API key tokens, client secrets, recovery codes) where the
 * user must grab the value before it disappears.
 */
export function CopyButton({
  value,
  label = "Copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — leave the value
      // visible so the user can still select it manually.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg hover:bg-bg-subtle ${className}`}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

/**
 * A monospace value box with a copy button — the standard presentation for a
 * one-time secret the user needs to copy.
 */
export function CopyField({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 overflow-x-auto rounded bg-canvas px-3 py-2 font-mono text-xs">
        {value}
      </code>
      <CopyButton value={value} />
    </div>
  );
}
