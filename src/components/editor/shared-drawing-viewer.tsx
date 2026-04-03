"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { PenLine, Eye, Pencil } from "lucide-react"
import "@excalidraw/excalidraw/index.css"

interface SharedDrawingViewerProps {
  title: string
  initialData: {
    elements: readonly any[]
    appState: Record<string, any>
    files: Record<string, any>
  }
  viewOnly: boolean
}

export function SharedDrawingViewer({
  title,
  initialData,
  viewOnly,
}: SharedDrawingViewerProps) {
  const [ExcalidrawComp, setExcalidrawComp] = useState<any>(null)

  useEffect(() => {
    import("@excalidraw/excalidraw")
      .then((mod) => {
        setExcalidrawComp(() => mod.Excalidraw)
      })
      .catch((err) => {
        console.error("Failed to load Excalidraw:", err)
      })
  }, [])

  if (!ExcalidrawComp) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <PenLine className="h-4 w-4" />
          <span className="text-sm font-medium">Draw</span>
        </div>
        <span className="text-muted-foreground text-sm">/</span>
        <h1 className="text-sm font-medium">{title}</h1>
        <Badge variant="outline" className="ml-auto gap-1">
          {viewOnly ? (
            <>
              <Eye className="h-3 w-3" />
              View only
            </>
          ) : (
            <>
              <Pencil className="h-3 w-3" />
              Edit mode
            </>
          )}
        </Badge>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <ExcalidrawComp
          initialData={{
            elements: initialData.elements || [],
            appState: initialData.appState || {},
            scrollToContent: true,
          }}
          viewModeEnabled={viewOnly}
          theme="light"
        />
      </div>
    </div>
  )
}
