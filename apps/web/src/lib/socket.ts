/**
 * Socket.IO client for collaboration.
 * Connects to the external Socket.IO server at NEXT_PUBLIC_SOCKET_URL.
 */
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(token: string): Socket {
  if (socket) {
    socket.disconnect()
    socket = null
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
    transports: ["websocket", "polling"],
    autoConnect: false,
    auth: { token },
  })

  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
