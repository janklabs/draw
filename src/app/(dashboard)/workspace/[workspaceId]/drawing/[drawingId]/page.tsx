import { getDrawing } from "@/lib/actions"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { DrawingEditor } from "@/components/editor/drawing-editor"

interface DrawingPageProps {
  params: Promise<{ workspaceId: string; drawingId: string }>
}

export default async function DrawingPage({ params }: DrawingPageProps) {
  const { workspaceId, drawingId } = await params

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const drawing = await getDrawing(drawingId)

  const sceneData = (drawing.sceneData as any) || {
    elements: [],
    appState: { viewBackgroundColor: "#ffffff" },
    files: {},
  }

  return (
    <DrawingEditor
      drawingId={drawingId}
      workspaceId={workspaceId}
      title={drawing.title}
      initialData={sceneData}
      userId={session.user.id}
      userName={session.user.name}
    />
  )
}
