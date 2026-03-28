"use client"

import { useState, useEffect } from "react"
import {
  createShareLink,
  getShareLinks,
  deleteShareLink,
} from "@/lib/actions/share"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Share2,
  Copy,
  Trash2,
  Loader2,
  Check,
  Link as LinkIcon,
} from "lucide-react"
import { toast } from "sonner"

interface ShareDialogProps {
  drawingId: string
}

export function ShareDialog({ drawingId }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadLinks()
    }
  }, [open, drawingId])

  const loadLinks = async () => {
    try {
      const result = await getShareLinks(drawingId)
      setLinks(result)
    } catch {
      // handle error
    }
  }

  const handleCreate = async (permission: "view" | "edit") => {
    setLoading(true)
    try {
      const { token } = await createShareLink(drawingId, permission)
      // Copy to clipboard including the hash fragment from current URL
      const hash = window.location.hash
      const url = `${window.location.origin}/share/${token}${hash}`
      await navigator.clipboard.writeText(url)
      toast.success("Share link copied to clipboard!")
      await loadLinks()
    } catch {
      toast.error("Failed to create share link")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (token: string) => {
    const hash = window.location.hash
    const url = `${window.location.origin}/share/${token}${hash}`
    await navigator.clipboard.writeText(url)
    setCopied(token)
    toast.success("Link copied!")
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async (linkId: string) => {
    await deleteShareLink(linkId)
    await loadLinks()
    toast.success("Share link deleted")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-3.5 w-3.5" />
            Share
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share drawing</DialogTitle>
          <DialogDescription>
            Create a link to share this drawing. The encryption key is included
            in the URL fragment so only people with the link can view the
            content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button
              onClick={() => handleCreate("view")}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              Create view link
            </Button>
            <Button
              onClick={() => handleCreate("edit")}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              Create edit link
            </Button>
          </div>

          {links.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Active links</h4>
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {link.permission}
                    </Badge>
                    <span className="text-muted-foreground font-mono text-xs">
                      ...{link.token.slice(-8)}
                    </span>
                    {link.expiresAt && (
                      <span className="text-muted-foreground text-xs">
                        expires {new Date(link.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopy(link.token)}
                    >
                      {copied === link.token ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
