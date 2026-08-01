"use client";

import { useState } from "react";

/**
 * Radio group styled as a segmented control. Client-side so the active pill
 * follows the click immediately instead of only after the server round-trip.
 * With `submitOnChange` the enclosing form re-submits on selection, which is
 * what a filter bar wants — the choice applies without a second click.
 */
export function SegmentedToggle({
  name,
  options,
  value,
  submitOnChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  submitOnChange?: boolean;
}) {
  const [selected, setSelected] = useState(value);
  return (
    <div className="inline-flex rounded border border-border p-0.5">
      {options.map((option) => {
        const active = option.value === selected;
        return (
          <label
            key={option.value}
            className={`cursor-pointer rounded px-4 py-1 text-sm ${
              active
                ? "bg-accent-subtle font-medium text-accent-emphasis"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={active}
              onChange={(e) => {
                setSelected(option.value);
                if (submitOnChange) e.currentTarget.form?.requestSubmit();
              }}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
