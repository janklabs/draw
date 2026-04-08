# Draw

Self-hosted collaborative whiteboard powered by [Excalidraw](https://excalidraw.com). All the features of Excalidraw+ without the subscription.

## Features

- Full Excalidraw editor (all drawing tools, shapes, text, images, libraries)
- Email magic link authentication (passwordless)
- Workspaces to organize drawings
- Real-time collaboration via WebSockets
- End-to-end encryption (AES-GCM 128-bit, key in URL fragment — server never sees plaintext)
- Shareable links (view or edit, optional expiration)
- Version history with save and restore
- Auto-save (2-second debounce)

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions)
- [React 19](https://react.dev)
- [@excalidraw/excalidraw](https://www.npmjs.com/package/@excalidraw/excalidraw)
- [better-auth](https://www.better-auth.com) (magic link email authentication)
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Socket.IO](https://socket.io) (real-time collaboration relay)
- Custom Node.js server (Next.js + Socket.IO in a single process)

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL database
- SMTP server for magic link emails

### Setup

```bash
# Install dependencies
npm ci

# Copy environment variables and fill in your values
cp .env.example .env

# Push the database schema
npm run db:push

# Start the dev server
npm run dev
```

### Docker Compose

A sample `docker-compose.yml` for running Draw with PostgreSQL:

```yaml
services:
  draw:
    build:
      context: .
      args:
        BUILD_VERSION: dev
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://draw:draw@db:5432/draw"
      BETTER_AUTH_SECRET: "change-me-to-a-random-secret"
      BETTER_AUTH_URL: "http://localhost:3000"
      SMTP_HOST: "smtp.example.com"
      SMTP_USERNAME: "your-username"
      SMTP_PASSWORD: "your-password"
      SMTP_MAIL_FROM: "noreply@example.com"
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: draw
      POSTGRES_PASSWORD: draw
      POSTGRES_DB: draw
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U draw"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

Run with:

```bash
docker compose up --build
```

> **Note:** On first run you'll need to push the database schema. You can do this by running `npm run db:push` locally with `DATABASE_URL` pointed at the containerized Postgres, or by adding a migration step to the compose setup.

## Environment Variables

| Variable             | Required   | Description                                           |
| -------------------- | ---------- | ----------------------------------------------------- |
| `DATABASE_URL`       | Yes        | PostgreSQL connection string                          |
| `BETTER_AUTH_SECRET` | Production | Auth secret — generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL`    | Yes        | Public-facing URL of the app                          |
| `SMTP_HOST`          | Yes        | SMTP server hostname                                  |
| `SMTP_USERNAME`      | Yes        | SMTP auth username                                    |
| `SMTP_PASSWORD`      | Yes        | SMTP auth password                                    |
| `SMTP_MAIL_FROM`     | Yes        | Sender email address for magic link emails            |

See [`.env.example`](.env.example) for a full template.

## Scripts

| Command                  | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `npm run dev`            | Start dev server (custom server with Socket.IO)         |
| `npm run dev:next`       | Start Next.js dev server only (Turbopack, no Socket.IO) |
| `npm run build`          | Production build                                        |
| `npm run start`          | Start production server                                 |
| `npm run db:generate`    | Generate Drizzle migrations                             |
| `npm run db:migrate`     | Run Drizzle migrations                                  |
| `npm run db:push`        | Push schema directly to the database                    |
| `npm run db:studio`      | Open Drizzle Studio                                     |
| `npm run lint`           | ESLint                                                  |
| `npm run prettier:check` | Prettier format check                                   |
| `npm run prettier:write` | Prettier auto-format                                    |

## How E2E Encryption Works

Each drawing gets an AES-GCM 128-bit encryption key generated client-side via the Web Crypto API. The key is stored in the URL fragment (`#key=...`) which is never sent to the server. All drawing data is encrypted before leaving the browser. The server only stores opaque ciphertext.

Sharing a drawing = sharing the full URL (including the `#key=` fragment). Without the key, the server cannot read the drawing data.

During real-time collaboration, all messages sent over Socket.IO are encrypted client-side before transmission. The server acts as a dumb relay — it forwards encrypted binary blobs between room participants without ever decrypting them.

## Deployment

The project includes a multi-stage `Dockerfile` and a GitHub Actions workflow for CI/CD:

- **Push to main**: Prettier check, semantic release, Docker build + push, SSH deploy to VPS
- **Manual dispatch**: Force-push a Docker image with a custom tag
