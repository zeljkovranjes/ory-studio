"use client";

import { useState } from "react";
import type { ThemeTokens } from "@/lib/theme";
import { saveThemeAction } from "./actions";

const FIELDS: { key: keyof ThemeTokens; label: string }[] = [
  { key: "accent", label: "Accent" },
  { key: "accentEmphasis", label: "Accent (hover)" },
  { key: "accentSubtle", label: "Accent subtle" },
  { key: "foreground", label: "Text" },
  { key: "surface", label: "Surface" },
  { key: "border", label: "Border" },
  { key: "error", label: "Error" },
];

export function ThemeEditor({ initial }: { initial: ThemeTokens }) {
  const [tokens, setTokens] = useState<ThemeTokens>(initial);

  const set = (key: keyof ThemeTokens, value: string) =>
    setTokens((t) => ({ ...t, [key]: value }));

  return (
    <form action={saveThemeAction} className="grid gap-6 lg:grid-cols-2">
      {/* Controls */}
      <div className="space-y-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">{f.label}</span>
            <span className="flex items-center gap-2">
              <input
                type="color"
                value={tokens[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-border bg-surface"
                aria-label={`${f.label} color`}
              />
              <input
                name={f.key}
                value={tokens[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-9 w-28 rounded border border-border px-2 font-mono text-xs focus:border-accent focus:outline-none"
              />
            </span>
          </label>
        ))}
        <button
          type="submit"
          className="mt-2 h-10 rounded bg-accent px-5 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
        >
          Save theme
        </button>
      </div>

      {/* Live preview — a login card rendered with the chosen tokens */}
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: tokens.surface,
          borderColor: tokens.border,
          color: tokens.foreground,
        }}
      >
        <div className="mx-auto max-w-xs">
          <div className="mb-4 text-center text-base font-semibold">Sign in</div>
          <button
            type="button"
            className="mb-3 w-full rounded border py-2 text-sm font-medium"
            style={{ borderColor: tokens.border, color: tokens.foreground }}
          >
            Sign in with Google
          </button>
          <label className="mb-2 block text-xs font-medium">
            E-Mail
            <input
              readOnly
              value="jane@example.com"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              style={{ borderColor: tokens.border }}
            />
          </label>
          <label className="mb-3 block text-xs font-medium">
            Password
            <input
              readOnly
              type="password"
              value="password"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              style={{ borderColor: tokens.border }}
            />
          </label>
          <button
            type="button"
            className="w-full rounded py-2 text-sm font-medium"
            style={{ backgroundColor: tokens.accent, color: "#ffffff" }}
          >
            Sign in with password
          </button>
          <div
            className="mt-3 text-center text-xs"
            style={{ color: tokens.accent }}
          >
            Forgot password?
          </div>
        </div>
      </div>
    </form>
  );
}
