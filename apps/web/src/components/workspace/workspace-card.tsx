"use client"

import Link from "next/link"
import { formatDistanceToNow } from "@/lib/date"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { MoreHorizontal, Pencil, Trash2, FolderOpen } from "lucide-react"
import { deleteWorkspace, renameWorkspace } from "@/lib/actions"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WorkspaceCardProps {
  workspace: {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
  }
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName] = useState(workspace.name)

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    await renameWorkspace(workspace.id, newName.trim())
    setRenameOpen(false)
  }

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this workspace? All drawings will be lost.",
      )
    )
      return
    await deleteWorkspace(workspace.id)
  }

  return (
    <>
      <Card className="group relative transition-shadow hover:shadow-md">
        <Link href={`/workspace/${workspace.id}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{workspace.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Updated {formatDistanceToNow(workspace.updatedAt)}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Link>
        <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename workspace</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!newName.trim()}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
