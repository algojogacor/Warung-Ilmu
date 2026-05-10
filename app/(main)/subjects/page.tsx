import { db } from "@/lib/db"
import { subjects, posts } from "@/lib/db/schema"
import { desc, count, eq } from "drizzle-orm"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SubjectsPage() {
  const subjectsList = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      slug: subjects.slug,
      icon: subjects.icon,
      color: subjects.color,
      description: subjects.description,
      postCount: count(posts.id)
    })
    .from(subjects)
    .leftJoin(posts, eq(subjects.id, posts.subjectId))
    .groupBy(subjects.id)
    .orderBy(desc(count(posts.id)))

  return (
    <div className="py-6 max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Mata Pelajaran</h1>
        <p className="text-muted-foreground">Pilih mata pelajaran yang ingin kamu pelajari atau diskusikan.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {subjectsList.map(subject => (
          <Link key={subject.id} href={`/subjects/${subject.slug}`}>
            <div className="group bg-card rounded-xl border p-6 text-center hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer h-full flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
                style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
              >
                {subject.icon}
              </div>
              <h2 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{subject.name}</h2>
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{subject.description}</p>
              <div className="mt-4 pt-4 border-t border-border/50 w-full text-xs font-medium text-muted-foreground">
                {subject.postCount} Diskusi
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
