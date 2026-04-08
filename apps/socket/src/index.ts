/**
 * Standalone Socket.IO server for real-time collaboration.
 *
 * Authenticates connections via Better Auth one-time tokens.
 * All drawing data is E2E encrypted — this server is a dumb relay.
 */

import { createServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import { registerSocketHandlers } from "./handlers.js"

const port = parseInt(process.env.SOCKET_PORT || "3001", 10)
const corsOrigin = process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000"
const authUrl = process.env.SOCKET_AUTH_URL || "http://localhost:3000"

const httpServer = createServer((_req, res) => {
  // Health check endpoint
  res.writeHead(200, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ status: "ok" }))
})

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
})

// ─── One-time token authentication middleware ───
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token

  if (!token) {
    return next(new Error("Authentication required"))
  }

  try {
    const response = await fetch(`${authUrl}/api/auth/one-time-token/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      return next(new Error("Invalid or expired token"))
    }

    const data = await response.json()

    // Attach user info to the socket for use in handlers
    socket.data.userId = data.session?.userId || data.user?.id
    socket.data.userName = data.user?.name || "Anonymous"

    next()
  } catch (err) {
    console.error("Token verification failed:", err)
    next(new Error("Authentication failed"))
  }
})

registerSocketHandlers(io)

httpServer.listen(port, () => {
  console.log(`> Socket.IO server running on port ${port}`)
  console.log(`> CORS origin: ${corsOrigin}`)
  console.log(`> Auth URL: ${authUrl}`)
})
