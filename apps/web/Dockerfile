FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ─── Stage 1: Install dependencies ───
FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY package.json ./
COPY apps/web/package.json apps/web/
COPY packages/collaboration/package.json packages/collaboration/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───
FROM base AS build

ARG BUILD_VERSION=0.1.0

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/collaboration/node_modules ./packages/collaboration/node_modules 2>/dev/null || true

COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY packages/collaboration/ packages/collaboration/
COPY apps/web/ apps/web/

ENV NEXT_PUBLIC_APP_VERSION=$BUILD_VERSION
RUN pnpm --filter web build

# ─── Stage 3: Production runner ───
FROM node:22-alpine

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone output mirrors monorepo structure due to outputFileTracingRoot
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app/apps/web

CMD ["node", "server.js"]
