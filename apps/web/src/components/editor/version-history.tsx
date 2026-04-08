"use client"

import { useState, useEffect } from "react"
import {
  getVersions,
  restoreVersion,
  createVersion,
} from "@/lib/actions/version"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { History, RotateCcw, Save, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "@/lib/date"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface VersionHistoryProps {
  drawingId: string
}

export function VersionHistory({ drawingId }: VersionHistoryProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadVersions()
    }
  }, [open, drawingId])

  const loadVersions = async () => {
    setLoading(true)
    try {
      const result = await getVersions(drawingId)
      setVersions(result)
    } catch {
      toast.error("Failed to load versions")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVersion = async () => {
    setSaving(true)
    try {
      await createVersion(drawingId)
      toast.success("Version saved!")
      await loadVersions()
    } catch {
      toast.error("Failed to save version")
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async (versionId: string) => {
    if (
      !confirm(
        "Restore this version? The current state will be saved as a new version first.",
      )
    ) {
      return
    }

    try {
      await restoreVersion(versionId)
      toast.success("Version restored!")
      router.refresh()
      setOpen(false)
    } catch {
      toast.error("Failed to restore version")
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm">
            <History className="mr-2 h-3.5 w-3.5" />
            History
          </Button>
        }
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>
            Save snapshots and restore previous versions of your drawing.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Button
            onClick={handleSaveVersion}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save current version
          </Button>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center">
              <History className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">
                No versions saved yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Version {version.sceneVersion}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(version.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(version.id)}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
