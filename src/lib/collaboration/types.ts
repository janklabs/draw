/**
 * Collaboration types shared between client and server.
 */

export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
  SCENE_UPDATE: "scene-update",
  MOUSE_LOCATION: "mouse-location",
  IDLE_STATUS: "idle-status",

  // Server → Client
  ROOM_JOINED: "room-joined",
  ROOM_USER_CHANGE: "room-user-change",
  SERVER_BROADCAST: "server-broadcast",
  SERVER_VOLATILE: "server-volatile",
} as const

export interface RoomUser {
  socketId: string
  userId: string
  name: string
}

export interface MouseLocationData {
  socketId: string
  pointer: { x: number; y: number }
  button: string
  selectedElementIds: Record<string, boolean>
  username: string
}

export interface IdleStatusData {
  socketId: string
  userState: "active" | "idle" | "away"
  username: string
}

/** The message subtypes carried inside an encrypted payload */
export type CollabMessageType =
  | "SCENE_INIT"
  | "SCENE_UPDATE"
  | "MOUSE_LOCATION"
  | "IDLE_STATUS"

export interface CollabMessage {
  type: CollabMessageType
  payload: unknown
}
