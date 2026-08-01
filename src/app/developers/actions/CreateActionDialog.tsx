"use client";

import { useActionState, useState } from "react";
import { createAction, type CreateActionState } from "./actions";

const FLOWS = [
  { value: "login", label: "login" },
  { value: "registration", label: "registration" },
  { value: "settings", label: "settings" },
  { value: "recovery", label: "recovery" },
  { value: "verification", label: "verification" },
];
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function Segment({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange?: (v: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded border border-border p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <label
            key={o.value}
            className={`cursor-pointer rounded px-3 py-1 text-sm ${
              active
                ? "bg-accent-subtle font-medium text-accent-emphasis"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={active}
              onChange={() => onChange?.(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

export function CreateActionDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [flow, setFlow] = useState("login");
  const [timing, setTiming] = useState("after");
  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("");
  const [authType, setAuthType] = useState("none");
  const [basicUser, setBasicUser] = useState("");
  const [keyName, setKeyName] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [async, setAsync] = useState(false);
  const [processResponse, setProcessResponse] = useState(false);

  const [state, formAction, pending] = useActionState<
    CreateActionState,
    FormData
  >(createAction, {});

  const urlValid = /^https?:\/\/.+/.test(url.trim());
  const step1Valid = urlValid && flow !== "" && method !== "";
  const step2Valid =
    authType === "none" ||
    (authType === "basic" && basicUser.trim() !== "") ||
    (authType === "key" && keyName.trim() !== "" && keyValue !== "");

  function close() {
    setOpen(false);
    setStep(1);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis"
      >
        Create new Action
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-6">
          <div className="mt-10 w-full max-w-lg rounded-lg border border-border bg-surface shadow-xl">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold">
                {step === 1 ? "Action Base Details" : "Action authentication"}
              </h2>
            </div>

            <form
              action={formAction}
              onSubmit={(e) => {
                // Only the final step may submit — blocks stray implicit
                // submissions (e.g. Enter in a field) while still on step 1.
                if (step !== 2) e.preventDefault();
              }}
            >
              {state.error ? (
                <div className="mx-6 mt-5 rounded border border-error-muted bg-error-subtle px-4 py-2.5 text-sm text-error">
                  {state.error}
                </div>
              ) : null}

              {/* Step 1 — base details (kept mounted so values submit) */}
              <div className={step === 1 ? "space-y-5 px-6 py-5" : "hidden"}>
                <Field label="Flow">
                  <Segment
                    name="flow"
                    value={flow}
                    options={FLOWS}
                    onChange={setFlow}
                  />
                </Field>
                <Field label="Execution">
                  <Segment
                    name="timing"
                    value={timing}
                    options={[
                      { value: "before", label: "before" },
                      { value: "after", label: "after" },
                    ]}
                    onChange={setTiming}
                  />
                </Field>
                <Field label="URL">
                  <input
                    name="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.ory.com/"
                    className={`h-10 w-full rounded border px-3 font-mono text-xs text-input-text placeholder:text-input-placeholder focus:outline-none ${
                      url && !urlValid
                        ? "border-error-muted focus:border-error"
                        : "border-border focus:border-accent"
                    }`}
                  />
                  {url && !urlValid ? (
                    <p className="mt-1 text-sm text-error">
                      Enter a valid http(s) URL.
                    </p>
                  ) : null}
                </Field>
                <Field label="Method">
                  <Segment
                    name="http_method"
                    value={method}
                    options={METHODS.map((m) => ({ value: m, label: m }))}
                    onChange={setMethod}
                  />
                </Field>
                <Field
                  label="Action HTTP body"
                  hint="Customize the webhook's HTTP request body (Jsonnet). Leave empty for the default."
                >
                  <textarea
                    name="body"
                    rows={4}
                    placeholder={"function(ctx) {\n  identity_id: ctx.identity.id,\n}"}
                    className="block w-full rounded border border-border p-2 font-mono text-xs text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none"
                  />
                </Field>
                <ToggleRow
                  name="async"
                  label="Asynchronous"
                  hint="When enabled the action is processed in the background and cannot interrupt the flow or modify the identity."
                  checked={async}
                  onChange={(v) => {
                    setAsync(v);
                    if (v) setProcessResponse(false);
                  }}
                />
                <ToggleRow
                  name="process_response"
                  label="Process response"
                  hint="The webhook is triggered after form submission but before the identity is stored. It can modify identity data or interrupt the flow."
                  checked={processResponse}
                  onChange={(v) => {
                    setProcessResponse(v);
                    if (v) setAsync(false);
                  }}
                />
              </div>

              {/* Step 2 — authentication */}
              <div className={step === 2 ? "space-y-5 px-6 py-5" : "hidden"}>
                <Field
                  label="Authentication type"
                  hint="Select the authentication type for your Action."
                >
                  <Segment
                    name="auth_type"
                    value={authType}
                    options={[
                      { value: "none", label: "none" },
                      { value: "basic", label: "basic" },
                      { value: "key", label: "key" },
                    ]}
                    onChange={setAuthType}
                  />
                </Field>

                {authType === "basic" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Username">
                      <input
                        name="auth_user"
                        value={basicUser}
                        onChange={(e) => setBasicUser(e.target.value)}
                        className="h-10 w-full rounded border border-border px-3 text-sm focus:border-accent focus:outline-none"
                      />
                    </Field>
                    <Field label="Password">
                      <input
                        name="auth_password"
                        type="password"
                        className="h-10 w-full rounded border border-border px-3 text-sm focus:border-accent focus:outline-none"
                      />
                    </Field>
                  </div>
                ) : null}

                {authType === "key" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name">
                        <input
                          name="auth_key_name"
                          value={keyName}
                          onChange={(e) => setKeyName(e.target.value)}
                          placeholder="Authorization"
                          className="h-10 w-full rounded border border-border px-3 font-mono text-xs focus:border-accent focus:outline-none"
                        />
                      </Field>
                      <Field label="In">
                        <select
                          name="auth_key_in"
                          defaultValue="header"
                          className="h-10 w-full rounded border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none"
                        >
                          <option value="header">header</option>
                          <option value="cookie">cookie</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="Value">
                      <input
                        name="auth_key_value"
                        type="password"
                        value={keyValue}
                        onChange={(e) => setKeyValue(e.target.value)}
                        className="h-10 w-full rounded border border-border px-3 font-mono text-xs focus:border-accent focus:outline-none"
                      />
                    </Field>
                  </div>
                ) : null}

                {authType === "none" ? (
                  <div className="rounded border border-border bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
                    <span className="font-medium text-fg">Insecure endpoint</span>
                    <p className="mt-1">
                      Leaving a webhook&apos;s target endpoint unsecured can expose
                      your system to unauthorized access. Secure your endpoint with
                      strong authentication and encryption.
                    </p>
                  </div>
                ) : null}
              </div>

              {/*
                Keyed per step so React remounts the footer instead of morphing
                the same <button> node: turning "Next" into a submit button
                mid-click makes the browser submit the form on that same click.
              */}
              <div
                key={step}
                className="flex items-center justify-between border-t border-border px-6 py-4"
              >
                {step === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={close}
                      className="h-9 rounded border border-border px-4 text-sm font-medium text-fg hover:bg-bg-subtle"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!step1Valid}
                      onClick={() => setStep(2)}
                      className="h-9 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-9 rounded border border-border px-4 text-sm font-medium text-fg hover:bg-bg-subtle"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!step1Valid || !step2Valid || pending}
                      className="h-9 rounded bg-accent px-4 text-sm font-medium text-fg-on-accent hover:bg-accent-emphasis disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pending ? "Saving…" : "Save"}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium">{label}</div>
      {children}
      {hint ? <p className="mt-1.5 text-sm text-fg-muted">{hint}</p> : null}
    </div>
  );
}

function ToggleRow({
  name,
  label,
  hint,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-0.5 text-sm text-fg-muted">{hint}</div>
      </div>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-(--color-accent)"
      />
    </label>
  );
}
