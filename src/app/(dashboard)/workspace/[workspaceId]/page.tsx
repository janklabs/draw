import { getWorkspace, getDrawings } from "@/lib/actions"
import { CreateDrawingDialog } from "@/components/drawing/create-drawing-dialog"
import { DrawingCard } from "@/components/drawing/drawing-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileImage } from "lucide-react"
import Link from "next/link"

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params
  const [ws, drawings] = await Promise.all([
    getWorkspace(workspaceId),
    getDrawings(workspaceId),
  ])

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to workspaces
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{ws.name}</h1>
            <p className="text-muted-foreground text-sm">
              {drawings.length} drawing{drawings.length !== 1 ? "s" : ""}
            </p>
          </div>
          <CreateDrawingDialog workspaceId={workspaceId} />
        </div>
      </div>

      {drawings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileImage className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-1 text-lg font-medium">No drawings yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Create your first drawing in this workspace
          </p>
          <CreateDrawingDialog workspaceId={workspaceId} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drawings.map((d) => (
            <DrawingCard key={d.id} drawing={d} />
          ))}
        </div>
      )}
    </div>
  )
}
