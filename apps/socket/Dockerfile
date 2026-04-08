FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ─── Stage 1: Install dependencies ───
FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY package.json ./
COPY apps/socket/package.json apps/socket/
COPY packages/collaboration/package.json packages/collaboration/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───
FROM base AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/socket/node_modules ./apps/socket/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/collaboration/node_modules ./packages/collaboration/node_modules 2>/dev/null || true

COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY packages/collaboration/ packages/collaboration/
COPY apps/socket/ apps/socket/

RUN pnpm --filter @draw/socket build

# ─── Stage 3: Production runner ───
FROM node:22-alpine
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 socketio

COPY --from=build --chown=socketio:nodejs /app/apps/socket/dist ./dist
COPY --from=build --chown=socketio:nodejs /app/apps/socket/package.json ./
COPY --from=deps --chown=socketio:nodejs /app/apps/socket/node_modules ./node_modules 2>/dev/null || true
COPY --from=deps --chown=socketio:nodejs /app/node_modules ./hoisted_modules

# Merge hoisted modules for socket.io resolution
RUN cp -rn ./hoisted_modules/* ./node_modules/ 2>/dev/null || true && rm -rf ./hoisted_modules

USER socketio

EXPOSE 3001

ENV PORT=3001

CMD ["node", "dist/index.js"]
