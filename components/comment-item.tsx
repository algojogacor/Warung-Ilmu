"use client"

import { useState } from "react"
import { useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, MessageSquareReply } from "lucide-react"
import { VoteButtons } from "@/components/vote-buttons"
import { createCommentAction, acceptAnswerAction } from "@/server/actions/comment"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

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
}

interface CommentItemProps {
  comment: CommentData
  postId: string
  postType: string
  isPostAuthor: boolean
  currentUserId?: string
  replies?: CommentData[]
}

export function CommentItem({ comment, postId, postType, isPostAuthor, currentUserId, replies = [] }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleReplySubmit = () => {
    if (replyContent.trim().length < 2) return toast.error("Balasan terlalu pendek")

    startTransition(async () => {
      const res = await createCommentAction({ postId, content: replyContent, parentId: comment.id })
      if (res.error) toast.error(res.error)
      else {
        toast.success("Balasan ditambahkan")
        setIsReplying(false)
        setReplyContent("")
      }
    })
  }

  const handleAcceptAnswer = () => {
    startTransition(async () => {
      const res = await acceptAnswerAction(comment.id, postId)
      if (res.error) toast.error(res.error)
      else toast.success("Jawaban terbaik ditandai")
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`py-4 ${comment.isAcceptedAnswer ? "bg-emerald-500/5 -mx-4 px-4 rounded-xl border border-emerald-500/20" : ""}`}
      id={`comment-${comment.id}`}
    >
      <div className="flex gap-4">
        {/* Vote Sidebar */}
        <div className="hidden sm:flex flex-col items-center shrink-0">
          <VoteButtons
            initialScore={comment.voteScore}
            userVote={comment.userVote}
            isLoggedIn={!!currentUserId}
            postId={comment.id}
            isComment={true}
          />
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={comment.author.image || ""} />
                <AvatarFallback>{comment.author.name.slice(0,2)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm">{comment.author.name}</span>
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                {comment.author.reputation} rep
              </span>
              <span className="text-xs text-muted-foreground">
                • {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: id })}
              </span>
            </div>

            {comment.isAcceptedAnswer && (
              <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Jawaban Terbaik
              </span>
            )}
          </div>

          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
             <MarkdownRenderer content={comment.content} />
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <button onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-1 hover:text-foreground font-medium">
              <MessageSquareReply className="w-3.5 h-3.5" />
              Balas
            </button>

            {isPostAuthor && postType === "question" && !comment.isAcceptedAnswer && (
              <button
                onClick={handleAcceptAnswer}
                disabled={isPending}
                className="flex items-center gap-1 hover:text-emerald-500 font-medium transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tandai Jawaban
              </button>
            )}
          </div>

          <AnimatePresence>
            {isReplying && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pt-3 overflow-hidden"
              >
                <div className="flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Tulis balasanmu..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Batal</Button>
                  <Button size="sm" onClick={handleReplySubmit} disabled={isPending || replyContent.length < 2}>Kirim Balasan</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Nested Replies */}
          {replies.length > 0 && (
            <div className="pl-4 sm:pl-8 border-l-2 border-border/50 mt-4 space-y-4">
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  postType={postType}
                  isPostAuthor={isPostAuthor}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
