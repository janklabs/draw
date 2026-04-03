/**
 * Socket.IO server-side event handlers.
 *
 * The server is intentionally "dumb" – it relays encrypted binary blobs
 * between clients in a room without ever decrypting them.
 */

import { Server, Socket } from "socket.io"
import { SOCKET_EVENTS, type RoomUser } from "../lib/collaboration/types"

// In-memory room state
const rooms = new Map<string, Map<string, RoomUser>>()

function getRoomUsers(roomId: string): RoomUser[] {
  const room = rooms.get(roomId)
  if (!room) return []
  return Array.from(room.values())
}

function broadcastRoomUsers(io: Server, roomId: string) {
  io.to(roomId).emit(SOCKET_EVENTS.ROOM_USER_CHANGE, getRoomUsers(roomId))
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    let currentRoomId: string | null = null

    // ─── Join a drawing room ───
    socket.on(
      SOCKET_EVENTS.JOIN_ROOM,
      (data: { roomId: string; userId: string; name: string }) => {
        const { roomId, userId, name } = data

        // Leave previous room if any
        if (currentRoomId) {
          socket.leave(currentRoomId)
          const room = rooms.get(currentRoomId)
          if (room) {
            room.delete(socket.id)
            if (room.size === 0) {
              rooms.delete(currentRoomId)
            } else {
              broadcastRoomUsers(io, currentRoomId)
            }
          }
        }

        // Join new room
        socket.join(roomId)
        currentRoomId = roomId

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map())
        }

        rooms.get(roomId)!.set(socket.id, {
          socketId: socket.id,
          userId,
          name,
        })

        socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
          users: getRoomUsers(roomId),
        })

        broadcastRoomUsers(io, roomId)
      },
    )

    // ─── Leave room ───
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomId: string) => {
      socket.leave(roomId)
      const room = rooms.get(roomId)
      if (room) {
        room.delete(socket.id)
        if (room.size === 0) {
          rooms.delete(roomId)
        } else {
          broadcastRoomUsers(io, roomId)
        }
      }
      currentRoomId = null
    })

    // ─── Reliable scene updates (encrypted, relayed as-is) ───
    socket.on(
      SOCKET_EVENTS.SCENE_UPDATE,
      (roomId: string, encryptedBuffer: ArrayBuffer) => {
        // Broadcast to everyone else in the room
        socket.to(roomId).emit(SOCKET_EVENTS.SERVER_BROADCAST, encryptedBuffer)
      },
    )

    // ─── Volatile mouse location (encrypted, relayed as-is) ───
    socket.on(
      SOCKET_EVENTS.MOUSE_LOCATION,
      (roomId: string, encryptedBuffer: ArrayBuffer) => {
        socket.volatile
          .to(roomId)
          .emit(SOCKET_EVENTS.SERVER_VOLATILE, encryptedBuffer)
      },
    )

    // ─── Volatile idle status (encrypted, relayed as-is) ───
    socket.on(
      SOCKET_EVENTS.IDLE_STATUS,
      (roomId: string, encryptedBuffer: ArrayBuffer) => {
        socket.volatile
          .to(roomId)
          .emit(SOCKET_EVENTS.SERVER_VOLATILE, encryptedBuffer)
      },
    )

    // ─── Disconnect ───
    socket.on("disconnect", () => {
      if (currentRoomId) {
        const room = rooms.get(currentRoomId)
        if (room) {
          room.delete(socket.id)
          if (room.size === 0) {
            rooms.delete(currentRoomId)
          } else {
            broadcastRoomUsers(io, currentRoomId)
          }
        }
      }
    })
  })
}
