import { getWorkspaces } from "@/lib/actions"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"
import { WorkspaceCard } from "@/components/workspace/workspace-card"
import { FolderOpen } from "lucide-react"

export default async function DashboardPage() {
  const { owned, shared } = await getWorkspaces()
  const allWorkspaces = [...owned, ...shared]

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground text-sm">
            Organize your drawings into workspaces
          </p>
        </div>
        <CreateWorkspaceDialog />
      </div>

      {allWorkspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FolderOpen className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-1 text-lg font-medium">No workspaces yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Create your first workspace to get started
          </p>
          <CreateWorkspaceDialog />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allWorkspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}
    </div>
  )
}
