"use client"

import { lazy, Suspense } from "react"

const SharedDrawingViewer = lazy(() =>
  import("@/components/editor/shared-drawing-viewer").then((mod) => ({
    default: mod.SharedDrawingViewer,
  })),
)

interface SharedDrawingViewerLoaderProps {
  title: string
  initialData: {
    elements: readonly any[]
    appState: Record<string, any>
    files: Record<string, any>
  }
  viewOnly: boolean
}

export function SharedDrawingViewerLoader(
  props: SharedDrawingViewerLoaderProps,
) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      }
    >
      <SharedDrawingViewer {...props} />
    </Suspense>
  )
}
