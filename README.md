# ory-studio

Self-hosted console for the open-source Ory stack — one instance of Kratos, Hydra, Keto and
friends with a Supabase-Studio-style UI on top.

## Usage

```sh
pointless run up      # start the Ory service bundle (docker compose up -d)
pointless dev         # run the studio with hot reload at http://localhost:3000
pointless build       # production build
pointless test        # run the test suite
pointless lint        # eslint + tsc --noEmit
pointless run down    # stop the service bundle
```

Copy `.env.example` to `.env` and fill in values before `pointless dev`.

## What's inside

| Piece | Where |
|---|---|
| Studio app (Next.js) | `src/` |
| Service bundle | `docker-compose.yml` |
| Service configs (owned by the studio's config engine) | `config/kratos/`, `config/hydra/`, `config/keto/` |
| Feature blueprint extracted from Ory Console | `docs/ory-console-extraction.md` |

## Services & ports (dev defaults)

| Service | Port |
|---|---|
| Studio (dev) | 4480 |
| Kratos public / admin | 4433 / 4434 |
| Hydra public / admin | 4444 / 4445 |
| Keto read / write | 4466 / 4467 |
| Account experience UI | 4455 |
| Mailpit (dev inbox) | 8025 |

## Notes

- Single-tenant by default; `TENANCY_MODE=multi` flips on the tenant layer.
- The studio is protected by an HTTP Basic auth prompt (`STUDIO_ADMIN_USER` / `STUDIO_ADMIN_PASSWORD`).
- v1 covers the identity core: Identities, Sessions, Authentication, Message delivery.
