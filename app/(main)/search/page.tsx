import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { PostCard } from "@/components/post-card"
import { SearchIcon } from "lucide-react"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q || ""
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let searchResults: any[] = []

  if (query.trim()) {
    // Sanitize query for FTS5 (strip control characters to avoid syntax errors)
    const sanitizedQuery = query.replace(/[^\w\s\u00C0-\u017F]/gi, '').trim()

    if (sanitizedQuery) {
      // Utilize the FTS5 virtual table
      // Binding the query parameters appropriately
      const resultRaw = await db.run(sql`
        SELECT id, title, content
        FROM posts_fts
        WHERE posts_fts MATCH ${sanitizedQuery}
        ORDER BY rank
        LIMIT 20
      `)

    // Once we have FTS matches, fetch the real records to populate PostCard
    if (resultRaw.rows.length > 0) {
      const ids = resultRaw.rows.map(row => row[0]) // SQLite returns rows as arrays of values by default if not mapped

      if (ids.length > 0) {
        // Query the main posts table, joining users and subjects
        const { posts, users, subjects } = await import("@/lib/db/schema")
        const { inArray, eq, and } = await import("drizzle-orm")

        const { auth } = await import("@/lib/auth")
        const { headers } = await import("next/headers")
        const session = await auth.api.getSession({ headers: await headers() })

        searchResults = await db
          .select({
            id: posts.id,
            title: posts.title,
            content: posts.content,
            type: posts.type,
            createdAt: posts.createdAt,
            viewCount: posts.viewCount,
            voteScore: posts.voteScore,
            isSolved: posts.isSolved,
            isPinned: posts.isPinned,
            author: {
              id: users.id,
              name: users.name,
              image: users.image,
              reputation: users.reputation,
              isShadowBanned: users.isShadowBanned,
            },
            subject: {
              name: subjects.name,
              color: subjects.color,
              icon: subjects.icon,
            },
          })
          .from(posts)
          .innerJoin(users, eq(posts.authorId, users.id))
          .innerJoin(subjects, eq(posts.subjectId, subjects.id))
          .where(
            and(
              inArray(posts.id, ids as string[]),
              eq(posts.isDraft, false)
            )
          )

        // Post filter shadowban client-side for simplicity as joining or() makes query complex
        searchResults = searchResults.filter(p => !p.author.isShadowBanned || p.author.id === session?.user?.id)
      }
    }
    }
  }

  return (
    <div className="py-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <form method="GET" action="/search" className="flex items-center space-x-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Cari materi, soal, atau tips belajar..."
              className="w-full h-12 pl-10 pr-4 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button type="submit" className="h-12 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Cari
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {query && (
          <h2 className="font-semibold text-lg px-2">
            Hasil pencarian untuk &quot;{query}&quot; ({searchResults.length})
          </h2>
        )}

        {query && searchResults.length === 0 && (
          <div className="text-center py-16 bg-muted/20 border rounded-xl border-dashed">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-medium text-lg">Tidak ada hasil yang ditemukan</h3>
            <p className="text-muted-foreground mt-1 text-sm max-w-sm mx-auto">
              Coba gunakan kata kunci yang lebih umum atau periksa ejaanmu.
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {searchResults.map(post => (
             <PostCard key={post.id} post={post} />
          ))}
        </div>

        {!query && (
          <div className="text-center py-20 text-muted-foreground">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Masukkan kata kunci di atas untuk mulai mencari.</p>
          </div>
        )}
      </div>
    </div>
  )
}
