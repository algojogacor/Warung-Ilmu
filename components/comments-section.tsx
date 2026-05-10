"use client"

import { useState } from "react"
import { useTransition } from "react"
import { CommentItem } from "./comment-item"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createCommentAction } from "@/server/actions/comment"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface CommentData {
  id: string
  content: string
  createdAt: Date
  voteScore: number
  isAcceptedAnswer: boolean
  author: {
    id: string
    name: string
    image: string | null
    reputation: number
  }
  userVote: 1 | -1 | 0
  parentId: string | null
}

interface CommentsSectionProps {
  postId: string
  postType: string
  isPostAuthor: boolean
  initialComments: CommentData[]
}

export function CommentsSection({ postId, postType, isPostAuthor, initialComments }: CommentsSectionProps) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const { data: session } = useSession()
  const router = useRouter()

  const handleSubmit = () => {
    if (!session?.user) {
      toast.error("Silakan masuk untuk berkomentar")
      router.push("/login")
      return
    }

    if (content.length < 2) {
      toast.error("Komentar terlalu pendek")
      return
    }

    startTransition(async () => {
      const res = await createCommentAction({ postId, content })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Komentar berhasil dikirim")
        setContent("")
      }
    })
  }

  // Organize comments into a tree (1 level deep)
  const topLevelComments = initialComments.filter(c => !c.parentId)
  const replies = initialComments.filter(c => c.parentId)

  return (
    <div className="space-y-8">
      {/* New Comment Box */}
      <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <h3 className="font-semibold text-foreground">Berikan Jawaban atau Diskusi</h3>
        <Textarea
          placeholder="Tuliskan komentar, gunakan @username untuk menyebut seseorang, atau tambahkan markdown..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-y"
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending || content.length < 2}>
            {isPending ? "Mengirim..." : "Kirim Komentar"}
          </Button>
        </div>
      </div>

      {/* Comment List */}
      <div className="space-y-6">
        {topLevelComments.length === 0 ? (
          <div className="text-center p-8 border rounded-xl bg-card/50 text-muted-foreground">
            <p>Belum ada komentar. Jadilah yang pertama memberikan solusi!</p>
          </div>
        ) : (
          topLevelComments.map(comment => {
            const commentReplies = replies.filter(r => r.parentId === comment.id)
            return (
              <div key={comment.id} className="border-b border-border/50 last:border-0 pb-6 last:pb-0">
                <CommentItem
                  comment={comment}
                  postId={postId}
                  postType={postType}
                  isPostAuthor={isPostAuthor}
                  currentUserId={session?.user?.id}
                  replies={commentReplies}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
