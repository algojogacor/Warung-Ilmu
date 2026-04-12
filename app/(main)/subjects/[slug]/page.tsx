import { db } from "@/lib/db"
import { subjects, posts, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { notFound } from "next/navigation"
import { PostCard } from "@/components/post-card"

export const dynamic = "force-dynamic"

export default async function SubjectDetailPage({ params }: { params: { slug: string } }) {
  const [subject] = await db.select().from(subjects).where(eq(subjects.slug, params.slug))

  if (!subject) notFound()

  const subjectPosts = await db
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
    .where(eq(posts.subjectId, subject.id))
    .orderBy(desc(posts.createdAt))
    .limit(50)

  return (
    <div className="py-6 max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-4 border-b pb-8">
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4"
          style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
        >
          {subject.icon}
        </div>
        <h1 className="text-4xl font-bold">{subject.name}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{subject.description}</p>
      </header>

      <div className="space-y-4">
        {subjectPosts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border rounded-xl border-dashed">
            <p>Belum ada diskusi untuk pelajaran ini.</p>
          </div>
        ) : (
          subjectPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  )
}
