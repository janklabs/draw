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
import { MoreHorizontal, Pencil, Trash2, FileImage } from "lucide-react"
import { deleteDrawing, renameDrawing } from "@/lib/actions"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DrawingCardProps {
  drawing: {
    id: string
    title: string
    workspaceId: string
    createdAt: Date
    updatedAt: Date
  }
}

export function DrawingCard({ drawing }: DrawingCardProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [newTitle, setNewTitle] = useState(drawing.title)

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    await renameDrawing(drawing.id, newTitle.trim())
    setRenameOpen(false)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this drawing?")) return
    await deleteDrawing(drawing.id)
  }

  return (
    <>
      <Card className="group relative transition-shadow hover:shadow-md">
        <Link href={`/workspace/${drawing.workspaceId}/drawing/${drawing.id}`}>
          <CardHeader>
            <div className="bg-muted mb-3 flex h-32 items-center justify-center rounded-md">
              <FileImage className="text-muted-foreground h-10 w-10" />
            </div>
            <CardTitle className="text-base">{drawing.title}</CardTitle>
            <CardDescription className="text-xs">
              Updated {formatDistanceToNow(drawing.updatedAt)}
            </CardDescription>
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
              <DialogTitle>Rename drawing</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
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
              <Button type="submit" disabled={!newTitle.trim()}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
