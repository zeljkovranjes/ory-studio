/** Shared form controls for config pages — server-component friendly. */

import { ErrorState } from "./ui";

export function Toggle({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 border-b border-border py-3.5 last:border-b-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-0.5 text-sm text-fg-muted">{description}</div>
      </div>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 shrink-0 accent-(--color-accent)"
      />
    </label>
  );
}

export function TextField({
  name,
  label,
  description,
  defaultValue,
  placeholder,
  mono,
  wide,
}: {
  name: string;
  label: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <label className="block py-2.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`mt-1.5 block h-10 rounded border border-border bg-surface px-3 text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none ${
          mono ? "font-mono text-xs" : "text-sm"
        } ${wide ? "w-full max-w-xl" : "w-64"}`}
      />
      {description ? (
        <span className="mt-1.5 block text-sm text-fg-muted">{description}</span>
      ) : null}
    </label>
  );
}

export function SelectField({
  name,
  label,
  description,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  description?: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block py-2.5 text-sm">
      <span className="font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1.5 block h-10 w-64 rounded border border-border bg-surface px-3 text-sm text-input-text focus:border-accent focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description ? (
        <span className="mt-1.5 block text-sm text-fg-muted">{description}</span>
      ) : null}
    </label>
  );
}

/** Segmented radio toggle (e.g. Exact / Fuzzy) for use inside GET forms. */
export function SegmentedToggle({
  name,
  options,
  value,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
}) {
  return (
    <div className="inline-flex rounded border border-border p-0.5">
      {options.map((option) => {
        const active = option.value === value;
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
              defaultChecked={active}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

export function SaveButton({ label = "Save" }: { label?: string }) {
  return (
    <button
      type="submit"
      className="mt-5 h-10 rounded bg-accent px-5 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
    >
      {label}
    </button>
  );
}

/** Status banners driven by ?saved / ?warning / ?error search params. */
export function Flash({
  saved,
  warning,
  error,
}: {
  saved?: string;
  warning?: string;
  error?: string;
}) {
  return (
    <>
      {saved ? (
        <div className="mb-4 rounded border border-border bg-accent-subtle px-4 py-2.5 text-sm text-accent-emphasis">
          Configuration saved and the service was reloaded.
        </div>
      ) : null}
      {warning ? (
        <div className="mb-4 rounded border border-border bg-bg-subtle px-4 py-2.5 text-sm text-fg-muted">
          {warning}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <ErrorState message={error} />
        </div>
      ) : null}
    </>
  );
}
