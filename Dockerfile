# ─── Stage 1: Dependencies ───
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Build ───
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate drizzle migrations and build Next.js
RUN npx drizzle-kit generate 2>/dev/null || true
RUN npm run build

# ─── Stage 3: Production runner ───
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install tsx for running TypeScript server in production
RUN npm install -g tsx

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy custom server + source files it imports at runtime
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/lib/collaboration ./src/lib/collaboration
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db

# Copy production node_modules (for socket.io + drizzle used by custom server)
COPY --from=deps /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["tsx", "server.ts"]
