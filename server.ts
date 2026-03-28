/**
 * Custom Node.js server running Next.js + Socket.IO together.
 *
 * Usage:
 *   Development: npx tsx server.ts
 *   Production:  node server.js  (after build)
 */

import { createServer } from "http"
import next from "next"
import { Server as SocketIOServer } from "socket.io"
import { registerSocketHandlers } from "./src/server/socket-handlers"

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "0.0.0.0"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler)

  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  })

  registerSocketHandlers(io)

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.IO server running on path /api/socketio`)
  })
})
