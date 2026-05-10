import { db } from "@/lib/db"
import { posts, users, subjects } from "@/lib/db/schema"
import { desc, eq, and } from "drizzle-orm"
import { PostCard } from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// In Next.js App Router, we export metadata and page configuration directly
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { or } from "drizzle-orm"

export const dynamic = "force-dynamic"

export default async function HomePage({
  searchParams,
}: {
  searchParams: { type?: string; sort?: string }
}) {
  const selectedType = searchParams.type || "all"
  const sort = searchParams.sort || "newest"

  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id

  // Base conditions
  const conditions = [eq(posts.isDraft, false)]

  // Shadowban filter
  if (userId) {
    conditions.push(or(eq(users.isShadowBanned, false), eq(posts.authorId, userId))!)
  } else {
    conditions.push(eq(users.isShadowBanned, false))
  }

  if (selectedType !== "all") {
    conditions.push(eq(posts.type, selectedType))
  }

  // Define ordering
  let orderBy = [desc(posts.createdAt)]
  if (sort === "popular") {
    orderBy = [desc(posts.voteScore), desc(posts.createdAt)]
  }

  // Fetch posts with joins
  const fetchedPosts = await db
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
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(20)

  return (
    <div className="py-6 flex flex-col md:flex-row gap-6">
      {/* Main Feed */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Diskusi Terbaru</h1>

          <Tabs defaultValue={sort} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="newest" asChild>
                <Link href={`/?type=${selectedType}&sort=newest`}>Terbaru</Link>
              </TabsTrigger>
              <TabsTrigger value="popular" asChild>
                <Link href={`/?type=${selectedType}&sort=popular`}>Terpopuler</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filter Bar */}
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
          {["all", "discussion", "question", "tip", "summary"].map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              className="rounded-full whitespace-nowrap"
              asChild
            >
              <Link href={`/?type=${type}&sort=${sort}`}>
                {type === "all" ? "Semua" :
                 type === "discussion" ? "Diskusi" :
                 type === "question" ? "Pertanyaan" :
                 type === "tip" ? "Tips" : "Ringkasan"}
              </Link>
            </Button>
          ))}
        </div>

        {/* Post List */}
        {fetchedPosts.length === 0 ? (
          <div className="text-center py-20 border rounded-xl bg-card text-muted-foreground flex flex-col items-center">
            <div className="text-4xl mb-4">🏜️</div>
            <h3 className="text-lg font-medium text-foreground">Belum ada diskusi nih!</h3>
            <p className="mt-1">Jadilah yang pertama memulai topik ini.</p>
            <Button asChild className="mt-4">
              <Link href="/posts/new">Mulai Diskusi</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {fetchedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar (Desktop) */}
      <div className="hidden md:block w-80 space-y-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold mb-4">Tentang Warung Ilmu</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Platform komunitas belajar untuk pelajar SMA dan peserta UTBK Indonesia. Bertanya, berdiskusi, dan bagikan ringkasan materimu di sini!
          </p>
          <Button className="w-full" asChild>
            <Link href="/posts/new">Buat Post Baru</Link>
          </Button>
        </div>

        {/* Simplified Subject List for Sidebar */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold mb-4">Jelajahi Pelajaran</h3>
          <div className="space-y-2">
            <Link href="/subjects/matematika" className="flex items-center text-sm p-2 hover:bg-muted rounded-md transition-colors">
              <span className="mr-3 text-xl">📐</span> Matematika
            </Link>
            <Link href="/subjects/fisika" className="flex items-center text-sm p-2 hover:bg-muted rounded-md transition-colors">
              <span className="mr-3 text-xl">⚛️</span> Fisika
            </Link>
            <Link href="/subjects/kimia" className="flex items-center text-sm p-2 hover:bg-muted rounded-md transition-colors">
              <span className="mr-3 text-xl">🧪</span> Kimia
            </Link>
            <Link href="/subjects" className="text-sm text-primary font-medium p-2 block hover:underline">
              Lihat semua mata pelajaran &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
