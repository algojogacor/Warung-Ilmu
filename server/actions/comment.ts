"use server"

import { db } from "@/lib/db"
import { comments, notifications, users, posts } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import { checkContentModeration } from "@/lib/ai-moderation"
import { processUserStreak } from "./gamification"
import { eq, like, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(2, "Komentar terlalu pendek").max(5000),
  parentId: z.string().optional(),
})

const editCommentSchema = z.object({
  commentId: z.string(),
  content: z.string().min(2).max(5000)
})

export async function createCommentAction(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  try {
    const { postId, content, parentId } = createCommentSchema.parse(data)

    const moderationResult = await checkContentModeration(content)
    if (!moderationResult.isSafe) {
      return { error: "Komentar mengandung kata yang tidak sesuai komunitas." }
    }

    const [newComment] = await db.insert(comments).values({
      content,
      postId,
      authorId: session.user.id,
      parentId: parentId || null,
    }).returning({ id: comments.id })

    // Process mentions
    const mentionRegex = /@([a-zA-Z0-9_]+)/g
    const mentions = Array.from(new Set(content.match(mentionRegex) || []))

    // We limit mentions to prevent spam
    const validMentions = mentions.slice(0, 5)

    for (const mention of validMentions) {
      const username = mention.slice(1) // remove @
      // Look up user by name (in a real scenario, users should have unique usernames)
      const [mentionedUser] = await db.select().from(users).where(like(users.name, username))

      if (mentionedUser && mentionedUser.id !== session.user.id) {
        await db.insert(notifications).values({
          userId: mentionedUser.id,
          type: "mention",
          message: `${session.user.name} menyebut Anda di sebuah komentar`,
          link: `/posts/${postId}#comment-${newComment.id}`,
        })
      }
    }

    // Notify post author
    const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId))
    if (post && post.authorId !== session.user.id && !parentId) {
      await db.insert(notifications).values({
        userId: post.authorId,
        type: "comment",
        message: `${session.user.name} mengomentari postingan Anda`,
        link: `/posts/${postId}#comment-${newComment.id}`,
      })
    }

    await processUserStreak(session.user.id)

    revalidatePath(`/posts/${postId}`)
    return { success: true, id: newComment.id }

  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message }
    return { error: "Terjadi kesalahan server" }
  }
}

export async function acceptAnswerAction(commentId: string, postId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  // Verify post ownership
  const [post] = await db.select({ authorId: posts.authorId, type: posts.type }).from(posts).where(eq(posts.id, postId))
  if (!post || post.authorId !== session.user.id || post.type !== "question") {
    return { error: "Tindakan tidak diizinkan" }
  }

  await db.transaction(async (tx) => {
    // Un-accept previous answers
    await tx.update(comments).set({ isAcceptedAnswer: false }).where(eq(comments.postId, postId))
    // Accept new answer
    await tx.update(comments).set({ isAcceptedAnswer: true }).where(eq(comments.id, commentId))

    // Mark post as solved
    await tx.update(posts).set({ isSolved: true }).where(eq(posts.id, postId))

    // Reward points
    const [acceptedComment] = await tx.select({ authorId: comments.authorId }).from(comments).where(eq(comments.id, commentId))
    if (acceptedComment && acceptedComment.authorId !== session.user.id) {
      const [user] = await tx.select({ reputation: users.reputation }).from(users).where(eq(users.id, acceptedComment.authorId))
      if (user) {
         await tx.update(users).set({ reputation: user.reputation + 25 }).where(eq(users.id, acceptedComment.authorId))
      }
    }
  })

  revalidatePath(`/posts/${postId}`)
  return { success: true }
}

export async function editCommentAction(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  try {
    const { commentId, content } = editCommentSchema.parse(data)

    const [existing] = await db.select().from(comments).where(and(eq(comments.id, commentId), eq(comments.authorId, session.user.id)))
    if (!existing) return { error: "Komentar tidak ditemukan atau akses ditolak" }

    const { editHistory } = await import("@/lib/db/schema")

    // Log the old content before edit
    await db.insert(editHistory).values({
      commentId,
      previousContent: existing.content
    })

    await db.update(comments).set({
      content,
      editedAt: new Date()
    }).where(eq(comments.id, commentId))

    revalidatePath(`/posts/${existing.postId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message }
    return { error: "Terjadi kesalahan pada server" }
  }
}
