import { db } from "@/lib/db"
import { subjects } from "@/lib/db/schema"

import CreatePostForm from "./create-post-form"

export const dynamic = "force-dynamic"

export default async function NewPostPage() {
  const subjectsList = await db.select().from(subjects)

  return (
    <div className="py-6 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Mulai Diskusi Baru</h1>
        <p className="text-muted-foreground mt-2">
          Bagikan pertanyaan, tips, atau ringkasan materi untuk saling membantu sesama pelajar.
        </p>
      </header>

      <CreatePostForm subjects={subjectsList} />
    </div>
  )
}
