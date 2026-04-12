"use client"

import { useOptimistic, useTransition } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"
import { motion } from "framer-motion"
import { voteAction } from "@/server/actions/vote"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface VoteButtonsProps {
  postId: string
  initialScore: number
  userVote: 1 | -1 | 0
  isLoggedIn: boolean
}

export function VoteButtons({ postId, initialScore, userVote, isLoggedIn }: VoteButtonsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [optimisticVote, addOptimisticVote] = useOptimistic(
    { score: initialScore, vote: userVote },
    (state, newVote: 1 | -1) => {
      let deltaScore = 0
      let nextVote: 1 | -1 | 0 = 0

      if (state.vote === newVote) {
        // Toggle off
        deltaScore = -newVote
        nextVote = 0
      } else if (state.vote !== 0) {
        // Change vote
        deltaScore = newVote * 2
        nextVote = newVote
      } else {
        // New vote
        deltaScore = newVote
        nextVote = newVote
      }

      return { score: state.score + deltaScore, vote: nextVote }
    }
  )

  const handleVote = (value: 1 | -1) => {
    if (!isLoggedIn) {
      toast.error("Harap masuk untuk melakukan vote")
      router.push("/login")
      return
    }

    startTransition(async () => {
      addOptimisticVote(value)
      try {
        await voteAction(postId, value)
      } catch {
        toast.error("Gagal melakukan vote")
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-1 bg-muted/50 rounded-xl p-1 w-12 border">
      <motion.button
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={() => handleVote(1)}
        className={`p-2 rounded-full transition-colors ${optimisticVote.vote === 1 ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground hover:bg-muted"}`}
        disabled={isPending}
        aria-label="Upvote post"
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>

      <span className="font-bold text-sm select-none" aria-label={`Current score: ${optimisticVote.score}`}>
        {optimisticVote.score}
      </span>

      <motion.button
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={() => handleVote(-1)}
        className={`p-2 rounded-full transition-colors ${optimisticVote.vote === -1 ? "text-indigo-500 bg-indigo-500/10" : "text-muted-foreground hover:bg-muted"}`}
        disabled={isPending}
        aria-label="Downvote post"
      >
        <ArrowDown className="w-5 h-5" />
      </motion.button>
    </div>
  )
}
