# ory-studio — Security model

ory-studio is an **administrative control plane** for a self-hosted Ory stack. It
holds the keys to the kingdom: it can read/write every identity, mint recovery
codes, create OAuth2 clients, rewrite service configuration, and restart
containers. Treat it like a database admin console, not a public web app.

## Trust boundary

- **The studio is single-admin and fully trusted once authenticated.** Every
  page and server action assumes the caller is the operator. There is no
  per-feature authorization beyond the front-door login.
- Protect the front door (below) and keep the studio off the public internet.

## Authentication

- **Studio login**: a signed **session cookie**, not HTTP Basic auth. The
  `/login` page (`src/app/login/`) verifies the password constant-time
  (`src/lib/constant-time.ts`) against `STUDIO_ADMIN_PASSWORD`, then sets an
  HttpOnly, SameSite=Lax session cookie. `src/middleware.ts` verifies the
  cookie's HMAC-SHA256 signature (constant-time, Web Crypto — Edge-safe) and the
  expiry on every request, redirecting to `/login` when absent/invalid. Cookie
  sessions avoid credentials-in-URL, so server actions (every Save) work.
  - Signing secret: `STUDIO_SESSION_SECRET`, or derived from the admin password
    when unset. Set `STUDIO_SECURE_COOKIES=true` to mark the cookie Secure under
    HTTPS. Sessions expire after 12h.
  - If `STUDIO_ADMIN_PASSWORD` is unset the studio is **open** — only acceptable
    on a local dev machine. Always set it elsewhere.
  - **Token revocation is coarse**: logout clears the cookie, but an exfiltrated
    token stays valid until expiry (no server-side session store). Acceptable for
    a single-admin tool; rotate `STUDIO_SESSION_SECRET` to invalidate all tokens.
  - There is **no built-in login rate limiting** (middleware runs stateless on
    the Edge runtime). Mitigate with a strong password and by placing the studio
    behind a reverse proxy / VPN / IP allow-list that does rate limiting.
- **Event collector** (`/api/internal/events/[event]`): exempt from the login
  redirect because Kratos webhooks can't sign in. Authenticated instead by the
  shared `STUDIO_COLLECTOR_TOKEN`, compared constant-time. Fails closed if the
  token is unset. The event name is validated against an allow-list.

## Injection surfaces (reviewed)

- **SQL**: all queries in `src/lib/events.ts` are parameterized (`$1`…). Dynamic
  fragments (the optional filter, `LIMIT`) are built from the parameter count,
  never from input; time-window strings resolve through a fixed allow-list.
- **SSRF / path traversal**: admin-API clients build URLs as
  `new URL(path, trustedBaseUrl)` with every user-supplied id `encodeURIComponent`-
  escaped. Base URLs come from environment, not requests.
  - Outbound URLs the admin configures (Actions/Webhooks, SMS endpoint, OIDC
    issuers) are validated for an `http(s)` scheme and then called by the Ory
    services, not by the studio. This is request-forgery *by design* — the admin
    decides who the services call — and is gated behind the studio login. Don't
    expose the studio to untrusted operators.
- **Config writes**: YAML is mutated through the `yaml` Document API (values are
  serialized safely, comments preserved), never string-concatenated.
- **No** `eval`, `new Function`, `dangerouslySetInnerHTML`, or shell-out exists in
  the codebase. Container reloads use the Docker Engine HTTP API with hardcoded
  service names, not a shell.

## Operator responsibilities (high-privilege design choices)

These are deliberate, necessary capabilities — secure them at deploy time:

1. **Docker socket.** The studio mounts `/var/run/docker.sock` to reload service
   containers after a config change ("Save = live"). The Docker socket is
   root-equivalent on the host. Anyone who compromises the studio controls Docker.
   → Run the studio on an isolated network, never expose it publicly, and
   consider a socket proxy that allows only `restart` if you need defense in depth.
2. **Service config contains live secrets after Save.** Writing the email,
   SMS, or OIDC settings persists SMTP passwords / client secrets / the collector
   token into `config/<service>/*.yml` in plaintext (the services must read them).
   → Treat the `config/` directory as sensitive in production. Do **not** commit
   it once it holds real secrets; mount it from a secret-managed volume. The
   committed files in this repo contain dev-only placeholder secrets.
3. **OPL editor writes executable TypeScript.** The Permissions page writes the
   Keto namespace file, which Keto evaluates. This is equivalent to editing the
   config file by hand and is gated behind the admin login — but it is arbitrary
   code-to-disk by design. Only trusted operators should have studio access.

## Secrets hygiene

- No secrets are committed: `.env` and `.env.*` (except `.env.example`) are
  git-ignored, as are `.claude/`, `.mcp.json`, and `.pointless/`.
- Code reads secrets only from the environment, never from a checked-in file.
- Dependency advisories: `pnpm audit --prod` is clean (a transitive postcss XSS
  advisory is force-patched via `pnpm-workspace.yaml` overrides).

## Reporting

This is an internal Pointless AI project; raise security issues in the org
workspace rather than a public tracker.
