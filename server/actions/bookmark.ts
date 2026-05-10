"use server"

import { db } from "@/lib/db"
import { bookmarks, bookmarkFolders } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function toggleBookmarkAction(postId: string, folderId?: string | null) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  const userId = session.user.id

  const [existing] = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)))

  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id))
  } else {
    await db.insert(bookmarks).values({
      userId,
      postId,
      folderId: folderId || null,
    })
  }

  revalidatePath(`/posts/${postId}`)
  revalidatePath(`/bookmarks`)
  return { success: true, bookmarked: !existing }
}

const folderSchema = z.object({
  name: z.string().min(1, "Nama folder tidak boleh kosong").max(30),
})

export async function createFolderAction(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  try {
    const { name } = folderSchema.parse(data)
    await db.insert(bookmarkFolders).values({
      userId: session.user.id,
      name,
    })
    revalidatePath(`/bookmarks`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message }
    return { error: "Terjadi kesalahan server" }
  }
}

export async function moveBookmarkAction(bookmarkId: string, folderId: string | null) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  await db.update(bookmarks).set({ folderId }).where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, session.user.id)))

  revalidatePath(`/bookmarks`)
  return { success: true }
}

export async function deleteFolderAction(folderId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  // Move bookmarks to default folder (null)
  await db.update(bookmarks).set({ folderId: null }).where(and(eq(bookmarks.folderId, folderId), eq(bookmarks.userId, session.user.id)))

  // Delete folder
  await db.delete(bookmarkFolders).where(and(eq(bookmarkFolders.id, folderId), eq(bookmarkFolders.userId, session.user.id)))

  revalidatePath(`/bookmarks`)
  return { success: true }
}
