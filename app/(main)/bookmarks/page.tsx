import { db } from "@/lib/db"
import { bookmarks, bookmarkFolders, posts, users, subjects } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { BookmarkManager } from "./bookmark-manager"

export default async function BookmarksPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Harap Masuk</h1>
        <p className="text-muted-foreground">Silahkan masuk untuk melihat dan mengelola bookmark.</p>
      </div>
    )
  }

  const userId = session.user.id

  // Fetch Folders
  const folders = await db.select().from(bookmarkFolders).where(eq(bookmarkFolders.userId, userId))

  // Fetch Bookmarks
  const rawBookmarks = await db
    .select({
      id: bookmarks.id,
      folderId: bookmarks.folderId,
      post: posts,
      author: users,
      subject: subjects
    })
    .from(bookmarks)
    .innerJoin(posts, eq(bookmarks.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(subjects, eq(posts.subjectId, subjects.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt))

  const bookmarksData = rawBookmarks.map(b => ({
    id: b.id,
    folderId: b.folderId,
    post: {
      ...b.post,
      author: b.author,
      subject: b.subject
    }
  }))

  return (
    <div className="py-6 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Koleksi Bookmark</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Simpan diskusi penting dan buat folder khusus agar mudah ditemukan kembali.
        </p>
      </header>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <BookmarkManager initialBookmarks={bookmarksData as any} initialFolders={folders} />
    </div>
  )
}
