"use server"

import { db } from "@/lib/db"
import { votes, posts, users } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function voteAction(postId: string, value: 1 | -1) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const userId = session.user.id

  // Check existing vote
  const [existingVote] = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.postId, postId)))

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
      await tx.insert(votes).values({ userId, postId, value })
      scoreDelta = value
      repDelta = value === 1 ? 10 : -2
    }

    // Update Post Score
    const [post] = await tx.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId))

    if (post) {
      // The update expects simple numeric deltas, not direct arithmetic bindings
      // In SQLite with Drizzle we just fetch current score, and add.
      // Alternatively we can use raw SQL if needed, but doing it in code for safety
      const [currPost] = await tx.select({ voteScore: posts.voteScore }).from(posts).where(eq(posts.id, postId))
      await tx.update(posts).set({ voteScore: currPost.voteScore + scoreDelta }).where(eq(posts.id, postId))

      if (post.authorId !== userId) {
        // Update user reputation
        const [currUser] = await tx.select({ reputation: users.reputation }).from(users).where(eq(users.id, post.authorId))
        await tx.update(users).set({ reputation: currUser.reputation + repDelta }).where(eq(users.id, post.authorId))
      }
    }
  })

  revalidatePath(`/posts/${postId}`)
  revalidatePath(`/`)
}