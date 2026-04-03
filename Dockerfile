# ─── Stage 1: Dependencies ───
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Build ───
FROM node:22-alpine AS build

ARG BUILD_VERSION=0.1.0

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate drizzle migrations and build Next.js
ENV NEXT_PUBLIC_APP_VERSION=$BUILD_VERSION
RUN npx drizzle-kit generate 2>/dev/null || true
RUN npm run build

# ─── Stage 3: Production runner ───
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install tsx for running TypeScript server in production
RUN npm install -g tsx

# Copy built assets
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Copy custom server + source files it imports at runtime
COPY --from=build --chown=nextjs:nodejs /app/server.ts ./server.ts
COPY --from=build --chown=nextjs:nodejs /app/src/server ./src/server
COPY --from=build --chown=nextjs:nodejs /app/src/lib/collaboration ./src/lib/collaboration
COPY --from=build --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build --chown=nextjs:nodejs /app/src/db ./src/db

# Copy production node_modules (for socket.io + drizzle used by custom server)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["tsx", "server.ts"]
