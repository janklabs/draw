"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { saveDrawing } from "@/lib/actions"
import { generateSocketToken } from "@/lib/actions/socket-token"
import { CollabPortal, type RoomUser } from "@/lib/collaboration"
import {
  generateEncryptionKey,
  exportKey,
  importKey,
  getKeyFromHash,
  setKeyInHash,
} from "@/lib/crypto"
import "@excalidraw/excalidraw/index.css"

interface ExcalidrawWrapperProps {
  drawingId: string
  initialData: {
    elements: readonly any[]
    appState: Record<string, any>
    files: Record<string, any>
  }
  userId: string
  userName: string
}

export function ExcalidrawWrapper({
  drawingId,
  initialData,
  userId,
  userName,
}: ExcalidrawWrapperProps) {
  const [ExcalidrawComp, setExcalidrawComp] = useState<any>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isCollaborating, setIsCollaborating] = useState(false)
  const [collaborators, setCollaborators] = useState<RoomUser[]>([])
  const excalidrawAPIRef = useRef<any>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sceneVersionRef = useRef(0)
  const portalRef = useRef<CollabPortal | null>(null)
  const lastBroadcastVersionRef = useRef<Map<string, number>>(new Map())

  // Dynamically import Excalidraw (it only works in browser)
  useEffect(() => {
    let mounted = true

    async function loadExcalidraw() {
      try {
        const mod = await import("@excalidraw/excalidraw")
        if (mounted) {
          setExcalidrawComp(() => mod.Excalidraw)
        }
      } catch (err) {
        console.error("Failed to load Excalidraw:", err)
        if (mounted) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load editor",
          )
        }
      }
    }

    loadExcalidraw()

    return () => {
      mounted = false
    }
  }, [])

  // Initialize collaboration
  useEffect(() => {
    let cancelled = false

    async function initCollaboration() {
      try {
        // Get or generate encryption key
        let keyString = getKeyFromHash()
        let key: CryptoKey

        if (keyString) {
          key = await importKey(keyString)
        } else {
          key = await generateEncryptionKey()
          keyString = await exportKey(key)
          setKeyInHash(keyString)
        }

        if (cancelled) return

        // Generate a one-time token for socket authentication
        const token = await generateSocketToken()

        const portal = new CollabPortal(
          drawingId,
          key,
          {
            onSceneInit: (elements) => {
              if (excalidrawAPIRef.current) {
                excalidrawAPIRef.current.updateScene({
                  elements,
                })
              }
            },
            onSceneUpdate: (elements) => {
              if (excalidrawAPIRef.current) {
                excalidrawAPIRef.current.updateScene({
                  elements,
                })
              }
            },
            onMouseLocation: (data) => {
              if (excalidrawAPIRef.current) {
                const collaboratorsMap = new Map(
                  excalidrawAPIRef.current.getAppState()?.collaborators || [],
                )
                collaboratorsMap.set(data.socketId, {
                  username: data.username,
                  pointer: data.pointer,
                  button: data.button,
                  selectedElementIds: data.selectedElementIds,
                })
                excalidrawAPIRef.current.updateScene({
                  collaborators: collaboratorsMap,
                })
              }
            },
            onIdleStatus: (_data) => {
              // Could update presence indicators
            },
            onRoomUserChange: (users) => {
              setCollaborators(users)
            },
          },
          token,
        )

        portalRef.current = portal
        await portal.connect(userId, userName)
        if (!cancelled) {
          setIsCollaborating(true)
        }
      } catch (err) {
        console.error("Collaboration init failed:", err)
      }
    }

    initCollaboration()

    return () => {
      cancelled = true
      portalRef.current?.disconnect()
    }
  }, [drawingId, userId, userName])

  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      // Send incremental updates to collaborators
      if (portalRef.current) {
        const changedElements = elements.filter((el: any) => {
          const lastVersion = lastBroadcastVersionRef.current.get(el.id)
          return lastVersion === undefined || el.version > lastVersion
        })

        if (changedElements.length > 0) {
          portalRef.current.sendSceneUpdate(changedElements)
          changedElements.forEach((el: any) => {
            lastBroadcastVersionRef.current.set(el.id, el.version)
          })
        }
      }

      // Debounced auto-save: save 2 seconds after last change
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        sceneVersionRef.current += 1
        const sceneData = {
          elements: elements.filter((el: any) => !el.isDeleted),
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            gridSize: appState.gridSize,
          },
          files: files || {},
        }

        try {
          await saveDrawing(drawingId, sceneData, sceneVersionRef.current)
        } catch (err) {
          console.error("Failed to save drawing:", err)
        }
      }, 2000)
    },
    [drawingId],
  )

  const handlePointerUpdate = useCallback(
    (payload: {
      pointer: { x: number; y: number }
      button: string
      pointersMap: Map<number, any>
    }) => {
      if (portalRef.current && excalidrawAPIRef.current) {
        const appState = excalidrawAPIRef.current.getAppState()
        portalRef.current.sendMouseLocation({
          pointer: payload.pointer,
          button: payload.button,
          selectedElementIds: appState?.selectedElementIds || {},
          username: userName,
        })
      }
    },
    [userName],
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-sm font-medium">
            Failed to load editor
          </p>
          <p className="text-muted-foreground mt-1 text-xs">{loadError}</p>
        </div>
      </div>
    )
  }

  if (!ExcalidrawComp) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading editor...</div>
      </div>
    )
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ExcalidrawComp
        excalidrawAPI={(api: any) => {
          excalidrawAPIRef.current = api
        }}
        initialData={{
          elements: initialData.elements || [],
          appState: {
            ...initialData.appState,
          },
          scrollToContent: true,
        }}
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        isCollaborating={isCollaborating}
        theme="light"
      />
    </div>
  )
}
