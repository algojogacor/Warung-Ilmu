"use server"

import { db } from "@/lib/db"
import { votes, posts, users } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function voteAction(postId: string, value: 1 | -1, isComment: boolean = false) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const userId = session.user.id

  // Check existing vote
  const [existingVote] = await db
    .select()
    .from(votes)
    .where(
      and(
        eq(votes.userId, userId),
        isComment ? eq(votes.commentId, postId) : eq(votes.postId, postId)
      )
    )

  // Let's wrap in transaction
  await db.transaction(async (tx) => {
    let scoreDelta = 0;
    let repDelta = 0;

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote
        await tx.delete(votes).where(eq(votes.id, existingVote.id))
        scoreDelta = -value
        repDelta = value === 1 ? -10 : 2
      } else {
        // Change vote
        await tx.update(votes).set({ value }).where(eq(votes.id, existingVote.id))
        scoreDelta = value * 2
        repDelta = value === 1 ? 12 : -12
      }
    } else {
      // New vote
      await tx.insert(votes).values(
        isComment
          ? { userId, commentId: postId, value }
          : { userId, postId, value }
      )
      scoreDelta = value
      repDelta = value === 1 ? (isComment ? 5 : 10) : -1 // Adjust reputation
    }

    if (isComment) {
      const { comments } = await import("@/lib/db/schema")
      const [comment] = await tx.select({ authorId: comments.authorId, voteScore: comments.voteScore }).from(comments).where(eq(comments.id, postId))

      if (comment) {
        await tx.update(comments).set({ voteScore: comment.voteScore + scoreDelta }).where(eq(comments.id, postId))
        if (comment.authorId !== userId) {
          const [currUser] = await tx.select({ reputation: users.reputation }).from(users).where(eq(users.id, comment.authorId))
          if (currUser) await tx.update(users).set({ reputation: currUser.reputation + repDelta }).where(eq(users.id, comment.authorId))
        }
      }
    } else {
      const [post] = await tx.select({ authorId: posts.authorId, voteScore: posts.voteScore }).from(posts).where(eq(posts.id, postId))

      if (post) {
        await tx.update(posts).set({ voteScore: post.voteScore + scoreDelta }).where(eq(posts.id, postId))
        if (post.authorId !== userId) {
          const [currUser] = await tx.select({ reputation: users.reputation }).from(users).where(eq(users.id, post.authorId))
          if (currUser) await tx.update(users).set({ reputation: currUser.reputation + repDelta }).where(eq(users.id, post.authorId))
        }
      }
    }
  })

  // We should revalidate appropriately. Since we don't have the original postId if it's a comment vote, we'll revalidate the root which covers home
  revalidatePath(`/`)
  revalidatePath(`/`)
}