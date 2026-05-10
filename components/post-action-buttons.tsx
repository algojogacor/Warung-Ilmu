"use client"

import { useState } from "react"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, Flag, Share2, Copy, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toggleBookmarkAction } from "@/server/actions/bookmark"
import { reportAction } from "@/server/actions/report"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export function PostActionButtons({ postId, isBookmarkedInitial }: { postId: string, isBookmarkedInitial: boolean }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isBookmarked, setIsBookmarked] = useState(isBookmarkedInitial)
  const [isCopied, setIsCopied] = useState(false)
  const [reportReason, setReportReason] = useState("")

  const handleBookmark = () => {
    if (!session?.user) return router.push("/login")

    startTransition(async () => {
      setIsBookmarked(!isBookmarked) // Optimistic
      const res = await toggleBookmarkAction(postId, null) // To default folder
      if (res.error) {
         toast.error(res.error)
         setIsBookmarked(isBookmarked) // Revert
      } else {
         toast.success(res.bookmarked ? "Disimpan ke bookmark" : "Dihapus dari bookmark")
      }
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopied(true)
    toast.success("Tautan disalin ke clipboard")
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleShareWA = () => {
    const text = encodeURIComponent(`Lihat diskusi ini di Warung Ilmu!\n\n${window.location.href}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  const handleShareX = () => {
    const text = encodeURIComponent(`Lihat diskusi ini di Warung Ilmu! ${window.location.href}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
  }

  const handleReport = async () => {
    if (!session?.user) return router.push("/login")
    if (!reportReason.trim()) return toast.error("Alasan wajib diisi")

    const res = await reportAction(postId, "post", reportReason)
    if (res.error) toast.error(res.error)
    else toast.success("Laporan berhasil dikirim ke admin")
  }

  return (
    <div className="flex items-center gap-2 mt-6 border-t pt-4">
      <Button
        variant={isBookmarked ? "secondary" : "ghost"}
        size="sm"
        onClick={handleBookmark}
        disabled={isPending}
        className={isBookmarked ? "text-primary" : "text-muted-foreground"}
      >
        <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
        {isBookmarked ? "Tersimpan" : "Simpan"}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Share2 className="w-4 h-4 mr-2" />
            Bagikan
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="sm" className="justify-start" onClick={handleCopyLink}>
              {isCopied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
              Salin Tautan
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-[#25D366] hover:text-[#25D366]/90" onClick={handleShareWA}>
              <MessageSquareIcon className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-foreground" onClick={handleShareX}>
              <XIcon className="w-4 h-4 mr-2" />
              X / Twitter
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex-1"></div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <Flag className="w-4 h-4 mr-2" />
            Laporkan
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Laporkan Konten</h4>
            <textarea
               value={reportReason}
               onChange={(e) => setReportReason(e.target.value)}
               className="w-full text-sm border rounded-md p-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
               placeholder="Kenapa konten ini melanggar aturan?"
            />
            <Button size="sm" className="w-full" onClick={handleReport}>Kirim Laporan</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MessageSquareIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function XIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
  )
}
