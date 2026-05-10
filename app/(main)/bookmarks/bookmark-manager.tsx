"use client"

import { useState } from "react"
import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core"
import { createFolderAction, moveBookmarkAction, deleteFolderAction } from "@/server/actions/bookmark"
import { toast } from "sonner"
import { PostCard } from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FolderPlus, Trash2, Folder as FolderIcon, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

// Types
type PostType = {
  id: string
  title: string
  content: string
  type: string
  createdAt: Date
  viewCount: number
  voteScore: number
  isSolved: boolean
  isPinned: boolean
  author: { name: string; image: string | null; reputation: number }
  subject: { name: string; color: string; icon: string }
}

type BookmarkType = {
  id: string
  folderId: string | null
  post: PostType
}

type FolderType = {
  id: string
  name: string
}

function DraggableBookmark({ bookmark }: { bookmark: BookmarkType }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: bookmark.id,
    data: { type: "bookmark" }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 10,
    opacity: 0.8
  } : undefined

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <div className="pointer-events-none">
         <PostCard post={bookmark.post} />
      </div>
    </div>
  )
}

function DroppableFolder({ folder, isSelected, onClick, onDelete }: { folder: FolderType | null, isSelected: boolean, onClick: () => void, onDelete?: () => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: folder ? folder.id : "default",
    data: { type: "folder" }
  })

  const bg = isOver ? "bg-primary/20 border-primary" : isSelected ? "bg-muted border-primary/50" : "bg-card border-border hover:bg-muted/50"

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`group flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${bg}`}
    >
      <div className="flex items-center gap-3">
        <FolderIcon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
        <span className="font-medium text-sm">{folder ? folder.name : "Semua Bookmark"}</span>
      </div>
      {folder && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

export function BookmarkManager({
  initialBookmarks,
  initialFolders
}: {
  initialBookmarks: BookmarkType[],
  initialFolders: FolderType[]
}) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks)
  const [folders] = useState(initialFolders)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const [newFolderName, setNewFolderName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    setIsCreating(true)
    const res = await createFolderAction({ name: newFolderName })
    setIsCreating(false)

    if (res.error) toast.error(res.error)
    else {
      toast.success("Folder dibuat")
      setNewFolderName("")
      router.refresh()
    }
  }

  const handleDeleteFolder = async (id: string) => {
    if(!confirm("Yakin hapus folder ini? Bookmark di dalamnya akan pindah ke Semua Bookmark.")) return

    const res = await deleteFolderAction(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success("Folder dihapus")
      router.refresh()
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const bookmarkId = String(active.id)
    const folderId = over.id === "default" ? null : String(over.id)

    // Optimistic update
    setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, folderId } : b))

    const res = await moveBookmarkAction(bookmarkId, folderId)
    if (res.error) {
      toast.error(res.error)
      // Revert
      setBookmarks(initialBookmarks)
    } else {
      toast.success("Bookmark dipindahkan")
    }
  }

  const visibleBookmarks = selectedFolder
    ? bookmarks.filter(b => b.folderId === selectedFolder)
    : bookmarks

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Folders */}
        <div className="w-full md:w-64 shrink-0 space-y-4">
          <div className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-1 uppercase tracking-wider">Folders</h3>

            <div className="space-y-1">
              <DroppableFolder
                folder={null}
                isSelected={selectedFolder === null}
                onClick={() => setSelectedFolder(null)}
              />
              {folders.map(f => (
                <DroppableFolder
                  key={f.id}
                  folder={f}
                  isSelected={selectedFolder === f.id}
                  onClick={() => setSelectedFolder(f.id)}
                  onDelete={() => handleDeleteFolder(f.id)}
                />
              ))}
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Folder Baru"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="h-9 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                />
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleCreateFolder} disabled={isCreating}>
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border rounded-xl p-6 shadow-sm min-h-[400px]">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name : "Semua Bookmark"}
              </h3>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full font-medium">
                {visibleBookmarks.length} item
              </span>
            </div>

            <div className="space-y-4">
              {visibleBookmarks.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed flex flex-col items-center">
                  <div className="text-4xl mb-4 opacity-50">📂</div>
                  <h3 className="text-lg font-medium text-foreground">Folder kosong</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Seret dan lepas bookmark ke folder ini untuk menyimpannya.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {visibleBookmarks.map(b => (
                    // We must pass the raw data required by DraggableBookmark, but the inner PostCard needs full Post object
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <DraggableBookmark key={b.id} bookmark={b as any} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  )
}
