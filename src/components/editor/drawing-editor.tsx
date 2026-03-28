"use client"

import { ExcalidrawWrapper } from "@/components/editor/excalidraw-wrapper"
import { ShareDialog } from "@/components/drawing/share-dialog"
import { VersionHistory } from "@/components/editor/version-history"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { Toaster } from "@/components/ui/sonner"

interface DrawingEditorProps {
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

export function DrawingEditor({
  drawingId,
  workspaceId,
  title,
  initialData,
  userId,
  userName,
}: DrawingEditorProps) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex items-center gap-3 border-b px-4 py-2 backdrop-blur">
        <Link href={`/workspace/${workspaceId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-sm font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <VersionHistory drawingId={drawingId} />
          <ShareDialog drawingId={drawingId} />
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            Live
          </Badge>
        </div>
      </div>
      <div className="flex-1">
        <ExcalidrawWrapper
          drawingId={drawingId}
          initialData={initialData}
          userId={userId}
          userName={userName}
        />
      </div>
      <Toaster />
    </div>
  )
}
