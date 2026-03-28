/**
 * Socket.IO client singleton for collaboration.
 */
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/api/socketio",
      transports: ["websocket", "polling"],
      autoConnect: false,
    })
  }
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
