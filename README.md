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

## Architecture

```
draw/
├── apps/
│   ├── web/          # Next.js app (draw.guneet.dev)
│   └── socket/       # Socket.IO relay server (socketio.draw.guneet.dev)
└── packages/
    └── collaboration/ # Shared types (@draw/collaboration)
```

The web app and socket server run as separate processes with separate domains. Authentication across domains uses Better Auth's [one-time token](https://better-auth.com/docs/plugins/one-time-token) plugin. All collaboration data is E2E encrypted — the socket server is a dumb relay that never sees plaintext.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions)
- [React 19](https://react.dev)
- [@excalidraw/excalidraw](https://www.npmjs.com/package/@excalidraw/excalidraw)
- [better-auth](https://www.better-auth.com) (magic link + one-time token authentication)
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Socket.IO](https://socket.io) (real-time collaboration relay)
- [pnpm](https://pnpm.io) workspaces (monorepo)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL database
- SMTP server for magic link emails

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables and fill in your values
cp .env.example apps/web/.env

# Push the database schema
pnpm db:push

# Start both dev servers
pnpm dev
```

This starts:

- **Web app** at `http://localhost:3000`
- **Socket server** at `http://localhost:3001`

### Docker Compose

```bash
docker compose up --build
```

This starts three services: `web` (port 3000), `socket` (port 3001), and `postgres` (port 5432).

> **Note:** On first run, push the database schema: `pnpm db:push` with `WEB_DATABASE_URL` pointed at the containerized Postgres.

## Environment Variables

### Web App (`WEB_` prefix)

| Variable                 | Required   | Description                                           |
| ------------------------ | ---------- | ----------------------------------------------------- |
| `WEB_DATABASE_URL`       | Yes        | PostgreSQL connection string                          |
| `WEB_AUTH_SECRET`        | Production | Auth secret — generate with `openssl rand -base64 32` |
| `WEB_AUTH_URL`           | Yes        | Public URL of the web app                             |
| `WEB_SMTP_HOST`          | Yes        | SMTP server hostname                                  |
| `WEB_SMTP_USERNAME`      | Yes        | SMTP auth username                                    |
| `WEB_SMTP_PASSWORD`      | Yes        | SMTP auth password                                    |
| `WEB_SMTP_MAIL_FROM`     | Yes        | Sender email address for magic link emails            |
| `NEXT_PUBLIC_SOCKET_URL` | Yes        | Public URL of the Socket.IO server                    |

### Socket Server (`SOCKET_` prefix)

| Variable             | Required | Description                                   |
| -------------------- | -------- | --------------------------------------------- |
| `SOCKET_PORT`        | No       | Port to listen on (default `3001`)            |
| `SOCKET_CORS_ORIGIN` | Yes      | Web app URL (for CORS)                        |
| `SOCKET_AUTH_URL`    | Yes      | Web app URL (for one-time token verification) |

See [`.env.example`](.env.example) for a full template.

## Scripts

| Command               | Description                           |
| --------------------- | ------------------------------------- |
| `pnpm dev`            | Start both web and socket dev servers |
| `pnpm dev:web`        | Start Next.js dev server only         |
| `pnpm dev:socket`     | Start Socket.IO dev server only       |
| `pnpm build`          | Build all apps                        |
| `pnpm db:push`        | Push schema directly to the database  |
| `pnpm db:studio`      | Open Drizzle Studio                   |
| `pnpm prettier:check` | Prettier format check                 |
| `pnpm prettier:write` | Prettier auto-format                  |

## How E2E Encryption Works

Each drawing gets an AES-GCM 128-bit encryption key generated client-side via the Web Crypto API. The key is stored in the URL fragment (`#key=...`) which is never sent to the server. All drawing data is encrypted before leaving the browser. The server only stores opaque ciphertext.

Sharing a drawing = sharing the full URL (including the `#key=` fragment). Without the key, the server cannot read the drawing data.

During real-time collaboration, all messages sent over Socket.IO are encrypted client-side before transmission. The socket server acts as a dumb relay — it forwards encrypted binary blobs between room participants without ever decrypting them.

## Deployment

The project includes multi-stage Dockerfiles for each app and a GitHub Actions workflow for CI/CD:

- **Push to main**: Prettier check, semantic release, Docker build + push (two images: web + socket), SSH deploy to VPS
- **Manual dispatch**: Force-push Docker images with a custom tag
