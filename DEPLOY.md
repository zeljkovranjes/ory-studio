# Deploying ory-studio

ory-studio is designed to run as a single self-hosted bundle: the studio plus
the Ory services (Kratos, Hydra, Keto), Postgres, the account-experience UI, and
a Caddy reverse proxy that terminates TLS. The simplest target is one VM.

## Single-VM deploy

1. **Provision a VM** with Docker + the Compose plugin, and a public IP.
2. **Point DNS** at the VM for four subdomains (or fewer if you don't need all
   services public): the studio, the account experience, the Kratos public API,
   and the Hydra public API.
3. **Configure secrets**: copy `.env.production.example` to `.env` on the host and
   fill in real domains, a strong admin password, a 32+ char session secret, a
   strong DB password, and a random collector token. The `.env` is git-ignored —
   keep it out of the repo.
4. **Launch**:

   ```sh
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

   Caddy provisions Let's Encrypt certificates automatically for the configured
   domains. The studio is served at `https://$STUDIO_DOMAIN`.

`pointless deploy` runs the same command for you.

## What the production overlay changes

- Adds a **Caddy** service (ports 80/443) reverse-proxying each subdomain to the
  right container, with automatic HTTPS.
- Sets `STUDIO_SECURE_COOKIES=true` so the session cookie is `Secure`.
- Removes the studio's host port (the proxy reaches it on the internal network).
- Switches every service to `restart: always`.

## Hardening checklist

- **Lock down the studio.** It is an admin control plane with the Docker socket
  mounted — put `$STUDIO_DOMAIN` behind a VPN or an IP allow-list at the proxy,
  and never expose it to the open internet. See `SECURITY.md`.
- **Rotate secrets** out of the example values. Rotating `STUDIO_SESSION_SECRET`
  invalidates all studio sessions.
- **Treat `config/` as sensitive** — once you Save settings, it holds live
  secrets (SMTP passwords, OAuth client secrets). Mount it from a secret-managed
  volume rather than committing it.
- **Back up Postgres** — it holds identities, OAuth clients, permissions, and the
  studio's own tables (tenants, organizations, SSO connections, events).

## Scaling beyond one VM

Each Ory service is independently deployable. For larger setups, run Kratos,
Hydra, and Keto as their own services against a managed Postgres, point the
studio's `ORY_*` URLs at them, and (in multi-tenant mode) register each instance
set as a tenant under Settings → Tenants.
