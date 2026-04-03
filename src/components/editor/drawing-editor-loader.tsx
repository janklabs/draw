"use client"

import { lazy, Suspense } from "react"

const DrawingEditor = lazy(() =>
  import("@/components/editor/drawing-editor").then((mod) => ({
    default: mod.DrawingEditor,
  })),
)

interface DrawingEditorLoaderProps {
  drawingId: string
  workspaceId: string
  title: string
  initialData: {
    elements: readonly any[]
    appState: Record<string, any>
    files: Record<string, any>
  }
  userId: string
  userName: string
}

export function DrawingEditorLoader(props: DrawingEditorLoaderProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading editor...</div>
        </div>
      }
    >
      <DrawingEditor {...props} />
    </Suspense>
  )
}
