"use server"

import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import { checkContentModeration } from "@/lib/ai-moderation"

const createPostSchema = z.object({
  title: z.string().min(10, "Judul minimal 10 karakter").max(200).trim(),
  content: z.string().min(30, "Konten minimal 30 karakter").max(50000).trim(),
  type: z.enum(['discussion', 'question', 'tip', 'summary']),
  subjectId: z.string().min(1, "Mata pelajaran wajib dipilih"),
  isDraft: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
})

export async function createPostAction(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  // Rate Limiting simulation would go here

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

    return { id: newPost.id }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }
    return { error: "Terjadi kesalahan pada server" }
  }
}