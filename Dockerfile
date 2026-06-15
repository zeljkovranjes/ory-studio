FROM node:22-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
# pnpm-workspace.yaml holds the dependency `overrides`; without it a frozen
# install fails with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH against the lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
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
