"use server"

import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import { checkContentModeration } from "@/lib/ai-moderation"
import { processUserStreak } from "./gamification"
import { postTags, editHistory } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { checkRateLimit } from "@/lib/rate-limit"

const createPostSchema = z.object({
  title: z.string().min(10, "Judul minimal 10 karakter").max(200).trim(),
  content: z.string().min(30, "Konten minimal 30 karakter").max(50000).trim(),
  type: z.enum(['discussion', 'question', 'tip', 'summary']),
  subjectId: z.string().min(1, "Mata pelajaran wajib dipilih"),
  tags: z.array(z.string().max(30)).max(5).default([]),
  isDraft: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
})

const editPostSchema = z.object({
  postId: z.string(),
  title: z.string().min(10).max(200).trim(),
  content: z.string().min(30).max(50000).trim(),
})

export async function createPostAction(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  // Rate Limit: 10 posts per hour
  const rateLimit = await checkRateLimit({
    key: `create_post:${session.user.id}`,
    limit: 10,
    windowMs: 60 * 60 * 1000
  })

  if (!rateLimit.success) {
    return { error: `Terlalu banyak membuat post. Silakan coba lagi dalam ${rateLimit.resetInMinutes} menit.` }
  }

  try {
    const parsedData = createPostSchema.parse(data)

    // AI Content Moderation Check
    const moderationResult = await checkContentModeration(parsedData.title + "\n\n" + parsedData.content)
    if (!moderationResult.isSafe) {
      return { error: "Konten kamu mengandung hal yang tidak sesuai komunitas. Coba periksa kembali ya! 🙏" }
    }

    const [newPost] = await db.insert(posts).values({
      title: parsedData.title,
      content: parsedData.content,
      type: parsedData.type,
      subjectId: parsedData.subjectId,
      authorId: session.user.id,
      isDraft: parsedData.isDraft,
      isAnonymous: parsedData.isAnonymous,
    }).returning({ id: posts.id })

    if (parsedData.tags.length > 0) {
      await db.insert(postTags).values(
        parsedData.tags.map(t => ({ postId: newPost.id, tag: t.toLowerCase() }))
      )
    }

    if (!parsedData.isDraft) {
      await processUserStreak(session.user.id)
    }

    return { id: newPost.id }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }
    return { error: "Terjadi kesalahan pada server" }
  }
}

export async function editPostAction(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  try {
    const { postId, title, content } = editPostSchema.parse(data)

    const [existing] = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.authorId, session.user.id)))
    if (!existing) return { error: "Post tidak ditemukan atau akses ditolak" }

    // Log the old content before edit
    await db.insert(editHistory).values({
      postId,
      previousContent: existing.content
    })

    await db.update(posts).set({
      title,
      content,
      editedAt: new Date()
    }).where(eq(posts.id, postId))

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message }
    return { error: "Terjadi kesalahan pada server" }
  }
}