"use client";

import { useState } from "react";

const inputCls =
  "mt-1 block h-9 w-full max-w-md rounded border border-border px-2 text-sm text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none";

/**
 * Authentication for the SMS provider's HTTP request — none, HTTP basic, or an
 * API key header/cookie. Secret fields are not pre-filled; re-enter them when
 * changing the auth. Submitted as part of the SMS config form.
 */
export function SmsAuthFields({
  defaultType,
  user,
  apiKeyName,
  apiKeyIn,
}: {
  defaultType: string;
  user: string;
  apiKeyName: string;
  apiKeyIn: string;
}) {
  const [type, setType] = useState(defaultType);

  return (
    <div className="py-2">
      <label className="block text-sm">
        <span className="font-medium">Authentication type</span>
        <select
          name="auth_type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 block h-9 w-56 rounded border border-border bg-surface px-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="none">None</option>
          <option value="basic_auth">Basic auth</option>
          <option value="api_key">API key</option>
        </select>
      </label>

      {type === "basic_auth" ? (
        <div className="mt-3 space-y-2">
          <input
            name="auth_user"
            defaultValue={user}
            placeholder="Username"
            className={inputCls}
          />
          <input
            name="auth_password"
            type="password"
            autoComplete="new-password"
            placeholder="Password"
            className={inputCls}
          />
        </div>
      ) : null}

      {type === "api_key" ? (
        <div className="mt-3 space-y-2">
          <input
            name="auth_name"
            defaultValue={apiKeyName}
            placeholder="Key name (e.g. Authorization)"
            className={inputCls}
          />
          <input
            name="auth_value"
            type="password"
            autoComplete="new-password"
            placeholder="Key value"
            className={inputCls}
          />
          <select
            name="auth_in"
            defaultValue={apiKeyIn || "header"}
            className="block h-9 w-40 rounded border border-border bg-surface px-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="header">In header</option>
            <option value="cookie">In cookie</option>
          </select>
        </div>
      ) : null}
    </div>
  );
}
