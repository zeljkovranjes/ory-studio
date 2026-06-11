@.pointless/CLAUDE.base.md

# ory-studio — repo-specific notes

- **What this is**: a self-hosted, single-instance console for the open-source Ory stack
  (Kratos, Hydra, Keto, Polis) — the way Supabase Studio is to Supabase. The full feature
  blueprint extracted from Ory Console lives in `docs/ory-console-extraction.md`. Read it
  before adding pages or features.
- **Tenancy**: single-tenant by default. All data access goes through the tenant context in
  `src/lib/tenant.ts`; never hardcode the assumption of one tenant outside that module.
  `TENANCY_MODE=single|multi` is the toggle.
- **Studio auth**: HTTP Basic auth in `src/middleware.ts` (`STUDIO_ADMIN_USER`/`STUDIO_ADMIN_PASSWORD`).
  If no password is configured, access is open (local dev only).
- **Service bundle**: `docker-compose.yml` ships Postgres + Kratos + Hydra + Keto +
  account-experience UI + Mailpit + the studio. Service configs live in `config/<service>/`.
  The studio is the config engine: UI "Save" rewrites these files and reloads containers
  (Docker socket). Don't introduce a second source of config truth.
- **Design system**: tokens in `src/app/globals.css` (`--color-accent: #3d53f5`, Inter +
  JetBrains Mono, canvas `#fcfcfc`, border `#eee`). Match the console shell: top bar →
  horizontal section tabs → per-section left sidebar → stacked cards each with its own Save.
- **Navigation IA** is data-driven from `src/lib/nav.ts`; add new pages there, not ad-hoc.
- **v1 scope**: identity core (Identities, Sessions, Authentication, Message delivery).
  Unimplemented sections render the ComingSoon page via the catch-all route.
- **No plan-gating**: features Ory Cloud gates behind paid plans are fully available here;
  never add upgrade/billing UI.
