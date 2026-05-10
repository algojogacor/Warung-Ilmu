import { ImageResponse } from 'next/og'
import { db } from "@/lib/db"
import { posts, subjects, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const runtime = 'edge'

export const alt = 'Warung Ilmu Post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const [post] = await db
    .select({
      title: posts.title,
      authorName: users.name,
      subjectName: subjects.name,
      subjectColor: subjects.color,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(subjects, eq(posts.subjectId, subjects.id))
    .where(eq(posts.id, params.id))

  if (!post) {
    return new ImageResponse(
      (
        <div style={{ background: 'white', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 'bold' }}>
          Post tidak ditemukan - Warung Ilmu
        </div>
      ),
      { ...size }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: `linear-gradient(to bottom right, ${post.subjectColor}20, #0f172a)`,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 32, fontWeight: 600, color: post.subjectColor, background: `${post.subjectColor}20`, padding: '12px 24px', borderRadius: '40px' }}>
          {post.subjectName}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h1 style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, margin: 0, maxWidth: '900px' }}>
            {post.title.length > 80 ? post.title.substring(0, 80) + '...' : post.title}
          </h1>
          <p style={{ fontSize: 36, color: '#94a3b8', margin: 0 }}>
            Diskusi oleh {post.authorName}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', borderTop: '2px solid #334155', paddingTop: '40px' }}>
          <div style={{ fontSize: 40, fontWeight: 800, background: 'linear-gradient(to right, #6366f1, #a855f7)', backgroundClip: 'text', color: 'transparent' }}>
            Warung Ilmu
          </div>
          <div style={{ fontSize: 24, color: '#64748b' }}>
            warungilmu.id
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
