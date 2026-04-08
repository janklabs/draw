/**
 * Collaboration portal – manages the Socket.IO connection for a drawing room.
 *
 * Handles:
 *  - Joining / leaving rooms
 *  - Sending encrypted scene updates
 *  - Receiving and decrypting remote updates
 *  - Cursor / presence tracking
 */

import { getSocket, disconnectSocket } from "@/lib/socket"
import { encryptToBuffer, decryptFromBuffer } from "@/lib/crypto"
import {
  SOCKET_EVENTS,
  type CollabMessage,
  type RoomUser,
} from "@draw/collaboration"
import type { Socket } from "socket.io-client"

export interface PortalCallbacks {
  onSceneInit: (elements: readonly any[]) => void
  onSceneUpdate: (elements: readonly any[]) => void
  onMouseLocation: (data: any) => void
  onIdleStatus: (data: any) => void
  onRoomUserChange: (users: RoomUser[]) => void
}

export class CollabPortal {
  private socket: Socket
  private roomId: string
  private encryptionKey: CryptoKey
  private callbacks: PortalCallbacks
  private connected = false

  constructor(
    roomId: string,
    encryptionKey: CryptoKey,
    callbacks: PortalCallbacks,
    token: string,
  ) {
    this.roomId = roomId
    this.encryptionKey = encryptionKey
    this.callbacks = callbacks
    this.socket = getSocket(token)
  }

  async connect(userId: string, userName: string) {
    if (this.connected) return

    this.socket.connect()

    this.socket.on("connect", () => {
      this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
        roomId: this.roomId,
        userId,
        name: userName,
      })
    })

    this.socket.on(SOCKET_EVENTS.ROOM_USER_CHANGE, (users: RoomUser[]) => {
      this.callbacks.onRoomUserChange(users)
    })

    // Reliable broadcasts (scene data)
    this.socket.on(
      SOCKET_EVENTS.SERVER_BROADCAST,
      async (encryptedBuffer: ArrayBuffer) => {
        try {
          const message = await decryptFromBuffer<CollabMessage>(
            encryptedBuffer,
            this.encryptionKey,
          )

          switch (message.type) {
            case "SCENE_INIT":
              this.callbacks.onSceneInit(message.payload as any[])
              break
            case "SCENE_UPDATE":
              this.callbacks.onSceneUpdate(message.payload as any[])
              break
          }
        } catch (err) {
          console.error("Failed to decrypt broadcast:", err)
        }
      },
    )

    // Volatile broadcasts (cursors, idle)
    this.socket.on(
      SOCKET_EVENTS.SERVER_VOLATILE,
      async (encryptedBuffer: ArrayBuffer) => {
        try {
          const message = await decryptFromBuffer<CollabMessage>(
            encryptedBuffer,
            this.encryptionKey,
          )

          switch (message.type) {
            case "MOUSE_LOCATION":
              this.callbacks.onMouseLocation(message.payload)
              break
            case "IDLE_STATUS":
              this.callbacks.onIdleStatus(message.payload)
              break
          }
        } catch {
          // Volatile messages can be dropped silently
        }
      },
    )

    this.connected = true
  }

  async sendSceneUpdate(elements: readonly any[]) {
    if (!this.connected) return

    const message: CollabMessage = {
      type: "SCENE_UPDATE",
      payload: elements,
    }

    const encrypted = await encryptToBuffer(message, this.encryptionKey)
    this.socket.emit(SOCKET_EVENTS.SCENE_UPDATE, this.roomId, encrypted)
  }

  async sendSceneInit(elements: readonly any[]) {
    if (!this.connected) return

    const message: CollabMessage = {
      type: "SCENE_INIT",
      payload: elements,
    }

    const encrypted = await encryptToBuffer(message, this.encryptionKey)
    this.socket.emit(SOCKET_EVENTS.SCENE_UPDATE, this.roomId, encrypted)
  }

  async sendMouseLocation(data: any) {
    if (!this.connected) return

    const message: CollabMessage = {
      type: "MOUSE_LOCATION",
      payload: data,
    }

    const encrypted = await encryptToBuffer(message, this.encryptionKey)
    this.socket.volatile.emit(
      SOCKET_EVENTS.MOUSE_LOCATION,
      this.roomId,
      encrypted,
    )
  }

  async sendIdleStatus(data: any) {
    if (!this.connected) return

    const message: CollabMessage = {
      type: "IDLE_STATUS",
      payload: data,
    }

    const encrypted = await encryptToBuffer(message, this.encryptionKey)
    this.socket.volatile.emit(SOCKET_EVENTS.IDLE_STATUS, this.roomId, encrypted)
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM, this.roomId)
      this.socket.removeAllListeners()
    }
    disconnectSocket()
    this.connected = false
  }
}
