# Ory Console — Full UI & Feature Extraction

> Source: live walkthrough of `console.ory.com` (project `459537c2-48f6-4ff8-8ece-4c9a4942519e`, slug `brave-spence-azfmzdcm0y`), 2026-06-11.
> Purpose: blueprint for **ory-studio** — a self-hosted, single-instance console for the open-source Ory stack, the way Supabase Studio is to Supabase.

## Product decisions (from owner)

1. **Single-tenant** by default, but architected so tenancy is a **config toggle** (`single` | `multi`). All data access goes through a tenant context internally; in single mode there is exactly one implicit tenant.
2. **No workspace/project switcher** in the top bar (the "safeoutput / safeoutput-dev" breadcrumb dropdowns in Ory's console). Removed.
3. **No "Plans and subscriptions"** page. Removed.
4. **Nothing is plan-gated.** Every feature Ory locks behind Growth/Enterprise (SAML, CAPTCHA, Organizations/SSO, event streams, edge sessions, token prefix, refresh-token grace reuse) is either fully available or replaced with a self-host equivalent.
5. **Auth to the studio itself**: simple browser login prompt (HTTP Basic-auth style popup) on visit.
6. Same look & feel as Ory Console (layout, IA, visual language re-implemented; we build our own components/assets — no copying Ory's proprietary code or logo).
7. **App stack**: Next.js (org `ts-node` stack); API routes host the event collector + config engine.
8. **Repo scope**: this repo ships the whole single-instance bundle (Supabase-style) — studio app + docker-compose for Kratos/Hydra/Keto/Polis/Postgres. `pointless dev` brings up everything.
9. **Config engine**: Docker control — studio mounts the Docker socket, rewrites service config files, and restarts/reloads containers itself ("Save = live").
10. **v1 milestone**: identity core first — UI shell + Identities, Sessions, Authentication config, Message delivery (the Kratos surface). OAuth2, Permissions, Activity analytics, Branding follow.

---

## 1. Global UI shell

- **Top bar** (white, ~48px): logo mark · breadcrumb (workspace / project — REMOVED in ours, replaced by instance name) · environment badge ("Development") · global **Search…** box (right) · external link to the Account Experience UI (`<base-url>/ui`) · **Help** menu · avatar menu.
- **Primary nav** (horizontal tab row under top bar, ~40px): `Get started · Activity · User management(Identities) · Authentication · Organizations · OAuth 2 · Permissions · Branding · Project settings`.
- **Page layout**: page title + breadcrumb (`Section/Sub-page`) → **left sidebar** with the section's sub-nav (text links, ~31px row height) → main content column of stacked **card sections**, each card = title, description w/ "Learn more" doc link, form fields, its own **Save** button.
- Patterns: toggle switches with helper text, inline warning callouts (yellow) and info callouts (blue), duration inputs (`1h1m10s` format) with "Reset to default", tag/chip list inputs (allowed origins, claims, scopes), data tables with sort/filter/pagination, "Send feedback" link, upgrade-plan callouts (REMOVED in ours).

## 2. Full sitemap (routes as observed)

```
/get-started
/activity                      (Live)
/activity/events               (Logs & events; filters: event_name, time_window)
/sessions                      (Sessions list)
/email-delivery                (Message delivery)
/identities                    (Users & identities)
/identity-schema               (Identity schema)
/authentication                (General)
/passwordless                  (Passwordless login)
/mfa                           (Two-factor auth)
/social-signin                 (Social Sign-In OIDC)
/saml                          (SAML Sign-In) [gated in Ory; ungated for us]
/authentication/sessions       (Session settings)
/authentication/recovery       (Account recovery)
/authentication/verification   (Account verification)
/email-configuration           (Email Configuration)
/sms-configuration             (SMS Configuration)
/developers/actions            (Actions & Webhooks)
/organizations                 (All organizations) [gated in Ory; ungated for us]
/oauth                         (Clients and applications)
/oauth/endpoints
/oauth/configure               (General)
/oauth/openid                  (OpenID Connect)
/oauth/urls
/oauth/lifespans
/oauth/strategies              (Token strategies)
/oauth/cookies
/permissions/configuration     (Namespace & rules)
/permissions/relationships     (Relationships)
/account-experience/theming    (Branding > Theming)
/account-experience/locales    (Branding > Localization)
/custom-domains                (Branding > Custom domains)
/browser-redirects             (Branding > Browser redirects)
/ui                            (Branding > UI URLs)
/email-templates               (Branding > Email templates)
/settings                      (Project settings > Overview)
/developers                    (Project settings > API Keys)
/settings/event-streams        [gated in Ory; replaced by self-host events]
/settings/collaborators        (Members)
/settings/advanced             (Preview features)
/settings/billing              (Plans and subscriptions) [REMOVED]
```

## 3. Per-page feature inventory

### Get started
- Quickstart cards per framework (ExpressJS, Flutter, React, Go, Next.js, PHP): "Download SDK" + "View documentation".
- Copyable env block: `ORY_SDK_URL`, `ORY_PROJECT_ID`.
- Guides & concepts card grid (Identities, Authentication & sessions, Account experience, OAuth2, Permissions, Developing with Ory) with doc links; Resources (docs, video tutorials, community Slack/Twitter).

### Activity
- **Live**: metric cards "Sign-ups" and "Logins" with trend hint, time-range picker (Last 24 Hours…); "Combined activity" line/bar chart (sign-ups vs logins over time buckets); "Traffic" panel; "Session location" (geo) panel; empty states "No data available / not enough traffic".
- **Logs & events**: event table (Event, Timestamp), filterable by `event_name` + `time_window` (deep-linked from OAuth metric cards, e.g. `OAuth2AccessTokenIssued`); banner promoting event streams (HTTPS / AWS SNS).
- **Sessions**: list of identity sessions w/ details; note "Expired sessions are automatically deleted after 30 days".
- **Message delivery**: list of courier messages (email + SMS) sent by self-service flows, with delivery status (Abandoned-rate guidance).

### User management
- **Users & identities**: table (select-all checkbox, per-row checkbox, identifier column, row "Options" menu), filter by identifier with **Exact / Fuzzy** radio toggle, **Create identity** button, page-size selector + prev/next pagination.
- **Identity schema**: JSON-Schema-based editor; schema list = **Custom schemas** (name, content hash, Default flag, Self-service flag, In-project flag) + **Preset schemas** (`preset://username`, `preset://email`, `preset://basic`, `preset://blank`, `preset://sms`); pick active/default schema.

### Authentication
- **General**: account-experience URL display; cookie domain; toggles — Enable registration, Enable password authentication, Enable sign-in after registration ("Session after registration" — auto for OIDC/WebAuthn/Passkey, affects password flows), Enable login hints (+ account-enumeration warning); "Maximum number of code submissions" (brute-force limit, default 5); CAPTCHA section (gated in Ory → we ship it).
- **Passwordless**: Passkeys (enable toggle, Display Name, advanced settings), One-Time Code login (enable), legacy WebAuthn passwordless (enable, Display Name, deprecation notice favoring passkeys).
- **Two-factor auth**: Require 2FA for login; Require 2FA for self-service settings; OTC MFA (enable, AAL warning); TOTP authenticator apps (enable, display name); WebAuthn second factor (enable, display name, hostname, **Allowed origins** list); Lookup secrets / backup codes (enable).
- **Social Sign-In (OIDC)**: master enable toggle; provider list (e.g. Google) each with **Test connection**; **Add new OpenID Connect provider**; Base Redirect URI.
- **SAML Sign-In**: SAML provider config (Enterprise-gated in Ory → ungated here via bridge, see §6).
- **Sessions**: session lifespan duration; privileged session age; cookie settings (Persist sessions toggle, SameSite select: Lax/…); Edge Sessions (Ory-Network-only CDN caching → dropped/stubbed).
- **Account recovery**: enable toggle; "Notify unknown recipients" toggle; recovery strategy select (**One-time passwords** vs magic links, with rationale callout).
- **Account verification**: enable email/phone verification; require verified address for login; notify unknown recipients; "verify new email/phone before applying"; verification strategy (OTP vs magic link); show verification screen after password registration; after OIDC registration.
- **Email Configuration**: server type radio — **Default / SMTP Server / HTTP Server**; custom sender name (requires custom server).
- **SMS Configuration**: endpoint URL; request method (GET/POST/PUT/PATCH); auth type (Basic / API Key); insecure-endpoint warning; advanced settings.
- **Actions & Webhooks**: action list (flow + trigger e.g. "Registration / OIDC / After", method, URL, created-at); **Create new Action** (webhooks on registration, login, recovery, verification, settings flows; before/after; per-method).

### Organizations (B2B SSO)
- Org list + create; per-org SSO connections (Enterprise-gated in Ory → ours ships it).

### OAuth 2
- **Clients and applications**: metric cards (Tokens issued 24h, Refresh tokens issued 24h, Token errors 24h — each deep-links to filtered event log); OAuth2 client table; **Create a new client** wizard.
- **Endpoints**: read-only copyable URLs — OIDC discovery `/.well-known/openid-configuration`, JWKS `/.well-known/jwks.json`, `/oauth2/auth`, `/oauth2/token`, `/userinfo`.
- **General**: Issuer URL (+ custom-domain mismatch warning); Claim customization (allowed top-level claims, mirror to `ext`, preserve ext claims, omit `nbf`, **Token Hook** webhook URL); Token prefix (`ory_at_…` style; gated → ours configurable); JWT grant config (JTI optional, IAT optional, max JWT TTL); Refresh-token rotation grace period (+ grace reuse count); Client-credentials default scope; PKCE enforced / enforced-for-public-clients.
- **OpenID Connect**: Webfinger overrides (JWKS/Token/Auth/Userinfo URLs, supported claims, supported scopes); JWKS broadcast keys (`hydra.openid.id-token`); subject identifier types (public/pairwise + pairwise salt); Dynamic Client Registration (enable, default scope, registration URL).
- **URLs**: login, registration, consent, logout, post-logout redirect, error UI URLs.
- **Lifespans**: login/consent request TTL, access-token TTL, refresh-token TTL, ID-token TTL, auth-code TTL.
- **Token strategies**: scope strategy (Wildcard/…), access-token strategy (**Opaque/JWT**), JWT scope claim (List/…).
- **Cookies**: SameSite mode; legacy SameSite=None workaround toggle.

### Permissions
- **Namespace & rules**: full-height code editor (line numbers) for the **Ory Permission Language** (TypeScript-based namespaces/permits), Save; doc links.
- **Relationships**: relation-tuple table rendered as sentence ("subject **is in** relation **of** Namespace object"); search by subject; **Add relationship**; items-per-page pagination.

### Branding (Account Experience)
- **Theming**: "Use legacy Hosted UI" toggle; live theme editor with real-time preview tabs (Login / Registration / Recovery / Verification) showing the actual flow UI (e.g. "Sign in with Google", email+password form); theme presets ("Ory Default Light"); custom colors + logo.
- **Localization**: locale customization (requires non-hosted UI).
- **Custom domains**: CNAME setup for cookies (Ory-Network concept → for us: base-URL / reverse-proxy guidance page).
- **Browser redirects**: global redirect URL; per-flow redirect tabs (Login, Registration, Settings, Verification, Recovery, Logout); **Allowed URLs** allow-list; reset-all.
- **UI URLs**: welcome-page toggle; custom UI URL per Kratos flow (login, registration, settings, verification, recovery, error).
- **Email templates**: custom templates (requires custom email server) per courier template type.

### Project settings
- **Overview**: environment, data location, created/updated dates; rename project; change environment (Development/Staging/Production); ~~move project~~ (multi-tenant only); Project ID, slug, API endpoint base URL, ~~Workspace ID~~.
- **API Keys**: Ory CLI setup helper; project API keys (create, shown once, revoke).
- **Event streams**: stream identity events to HTTPS endpoint / AWS SNS (gated → ours ships a self-host version).
- **Members**: active members table (name/email, role, member level, date added), pending invites, **Invite member(s)** — in single-tenant mode this is "studio admin users".
- **Advanced (Preview features)**: feature flags — Native recovery flows; recovery code via SMS; unified sign-up (vs profile-first); faster session extension; deprecated required-verification login error; auto-linking OIDC credentials; legacy post-registration verification; legacy post-login required verification; password profile registration node group; OAuth2 provider override `return_to`.
- ~~Plans and subscriptions~~ — removed.

## 4. Design system (extracted tokens)

- **Fonts**: Inter (UI, 16px base), JetBrains Mono (code). CSS vars `--font-inter`, `--font-jb-mono`.
- **Ory theme vars** (drive both console + account experience, prefix `--ory-theme-`):
  - accent: def `#3d53f5`, muted `#6475f7`, emphasis `#3142c4`, disabled `#e0e0e0`, subtle `#eceefe`
  - foreground: def `#171717`, muted `#616161`, subtle `#9e9e9e`, disabled `#bdbdbd`, on-dark/on-accent `#fff`
  - background: surface `#fff`, canvas `#fcfcfc`, subtle `#eee`
  - error: def `#9c0f2e`, subtle `#fce8ec`, muted `#e95c7b`, emphasis `#df1642`; success emphasis `#18a957`
  - border def `#eee`; input: bg `#fff`, text `#424242`, placeholder `#9e9e9e`, disabled `#e0e0e0`
- **Component stack observed**: Headless UI (menus), Radix UI (selects/popovers/pagination), Tailwind-style utility classes, Font Awesome brands icons, code editor w/ line gutters (Monaco/CodeMirror-class), charting w/ time buckets.
- Header area ≈ 48px top bar + ~40px tab nav (total ~103px), white on near-white canvas, 1px `#eee` separators, cards with generous padding and per-card Save buttons.

## 5. Ory stack required (open source)

| Console area | Ory component | API surface used |
|---|---|---|
| Identities, schemas, sessions, auth flows, recovery, verification, MFA, passkeys, social sign-in, courier (email/SMS), actions/webhooks, browser redirects, UI URLs | **Ory Kratos** | Admin API (`/admin/identities`, `/admin/sessions`, `/admin/courier/messages`), self-service flows, `kratos.yaml` config |
| OAuth2 clients, endpoints, claims, token strategies, lifespans, PKCE, DCR, JWKS, consent/login URLs, cookies | **Ory Hydra** | Admin API (`/admin/clients`, `/admin/keys`, introspection), `hydra.yaml` config |
| Permission namespaces (OPL), relationships, checks | **Ory Keto** | Read/Write APIs (relation tuples), OPL namespace config |
| Hosted account experience (`/ui`) incl. theming vars | **Ory Elements** + **kratos-selfservice-ui-node** | themed via `--ory-theme-*` |
| SAML sign-in, per-org enterprise SSO connections, SCIM directory sync | **Ory Polis** (formerly BoxyHQ SAML Jackson) | SAML/OIDC bridge wired in as a Kratos OIDC provider; SCIM 2.0 for org user provisioning |
| (optional) unified API gateway / studio protection | **Ory Oathkeeper** | access rules |
| Dev/ops tooling | **Ory CLI**, Ory SDKs | quickstarts page |

## 6. Build vs. buy per feature (console-only features)

| Feature | Plan |
|---|---|
| Config UI → live services | **In-house core**: studio renders/patches `kratos.yaml`/`hydra.yaml`/`keto.yaml` (or env) and hot-reloads containers — the heart of ory-studio |
| Activity metrics & charts | **In-house**: aggregate from Kratos/Hydra Prometheus metrics + DB; charts via Recharts |
| Logs & events / event streams | **In-house**: OTEL collector / log tail → Postgres table → table UI + webhook fan-out (replaces SNS streams) |
| Message delivery | Kratos OSS `/admin/courier/messages` (built-in) |
| SAML | **Ory Polis** (formerly BoxyHQ SAML Jackson) as SAML↔OIDC bridge wired in as a Kratos OIDC provider |
| Organizations / per-org SSO | **In-house** org model (Keto relationships + identity metadata) + Ory Polis per-org connections & SCIM directory sync |
| CAPTCHA | **Existing product**: Cloudflare Turnstile (or hCaptcha) in the self-service UI |
| Edge sessions | Dropped (CDN-specific to Ory Network) |
| Custom domains | Simplified to base-URL/reverse-proxy config page |
| Identity-schema & OPL editors | **Existing library**: Monaco editor + JSON Schema validation; Keto OPL syntax check |
| Studio login (basic-auth popup), members/API keys, search (⌘K) | **In-house** |
| Email sending (default server) | **Existing product**: any SMTP (Mailpit for dev) via Kratos courier |

## 7. Analytics & events architecture (Activity tab + Actions)

**Capture — one Postgres `events` table** `(ts, service, event_name, identity_id, session_id, ip, geo_country, geo_city, lat, lon, user_agent, payload jsonb)`, indexed on `(event_name, ts)`. Fed by:
1. **Self-injected Kratos webhooks** — config engine adds system hooks (`after registration/login/recovery/verification/settings`) pointing at studio's internal collector endpoint; payload carries identity, flow, method, IP, user-agent.
2. **Hydra token hook** — fires on every token issuance → `OAuth2AccessTokenIssued` / refresh events.
3. **Vector / OTEL Collector** tailing Kratos+Hydra structured logs → failures, token errors, admin ops, into the same table.

**Feature mapping**
- Sign-ups/Logins cards + Combined activity chart: SQL counts / `date_trunc` buckets over `events`; time-range picker = interval param.
- Session location: GeoLite2 (local mmdb) IP lookup at ingest; live sessions also expose `devices[]` (ip/user-agent/location) from Kratos.
- Traffic: v1 from flow events; v2 reverse-proxy access logs via Vector.
- Logs & events page: filtered query UI (`event_name`, `time_window`) — matches console deep-link params.
- Sessions page: direct Kratos `GET /admin/sessions` (+ revoke).
- Message delivery: direct Kratos `GET /admin/courier/messages` (status queued/sent/abandoned, channel, template).

**Actions implementation** — Kratos OSS *is* the actions engine; the page is a UI over config:
1. `actions` table: flow, timing (before/after), method filter, URL, HTTP method, auth (API key/Basic), Jsonnet body template, `can_interrupt`, response parsing.
2. Config engine compiles rows into `kratos.yaml` `selfservice.flows.<flow>.<timing>.<method>.hooks` (merged with system analytics hooks) and hot-reloads Kratos.
3. v2: optional relay mode — actions delivered via a studio-run queue (persist → forward → retry → delivery log); same relay implements the self-host replacement for Ory Network event streams.

## 8. Reference deployment (single instance)

`docker-compose`: Postgres · Kratos (+courier) · Hydra · Keto · Polis (SAML/SSO bridge) · kratos-selfservice-ui-node (account experience) · **ory-studio** (this app) · Mailpit (dev SMTP) · optional Oathkeeper. Studio talks to the three admin APIs over the internal network; tenancy toggle decides whether config maps to one fixed instance set or per-tenant sets.
