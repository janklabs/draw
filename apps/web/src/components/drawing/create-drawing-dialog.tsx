"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createDrawing } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"

interface CreateDrawingDialogProps {
  workspaceId: string
}

export function CreateDrawingDialog({ workspaceId }: CreateDrawingDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { id } = await createDrawing(workspaceId, title.trim() || undefined)
      setTitle("")
      setOpen(false)
      router.push(`/workspace/${workspaceId}/drawing/${id}`)
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New drawing
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Create drawing</DialogTitle>
            <DialogDescription>
              Give your drawing a name, or leave blank for &quot;Untitled&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Drawing name (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
