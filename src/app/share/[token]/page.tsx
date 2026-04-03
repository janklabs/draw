import { getDrawingByShareToken } from "@/lib/actions/share"
import { notFound } from "next/navigation"
import { SharedDrawingViewerLoader } from "@/components/editor/shared-drawing-viewer-loader"

interface SharePageProps {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params
  const result = await getDrawingByShareToken(token)

  if (!result) {
    notFound()
  }

  const { drawing, permission } = result

  const sceneData = (drawing.sceneData as any) || {
    elements: [],
    appState: { viewBackgroundColor: "#ffffff" },
    files: {},
  }

  return (
    <SharedDrawingViewerLoader
      title={drawing.title}
      initialData={sceneData}
      viewOnly={permission === "view"}
    />
  )
}
