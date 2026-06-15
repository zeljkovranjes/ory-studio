FROM node:22-alpine AS base
RUN corepack enable pnpm

# Install deps and build in a single stage. pnpm's node_modules uses symlinks
# into a virtual store, which don't survive a cross-stage `COPY node_modules`,
# so we install where we build. The runner only needs the self-contained
# `.next/standalone` output, not node_modules.
FROM base AS build
WORKDIR /app
# pnpm-workspace.yaml holds the dependency `overrides`; without it a frozen
# install fails with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH against the lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV STANDALONE=1
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
