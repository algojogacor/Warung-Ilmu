import { db } from "@/lib/db"
import { users, emailPreferences, posts } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_test_key")

import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET() {
  const reqHeaders = await headers()
  const authHeader = reqHeaders.get('authorization')

  if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Get top posts from last 7 days
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    // SQLite doesn't natively support Date object > / < directly easily without formatting,
    // but Drizzle handles timestamp modes if mapped properly.
    // For safety, let's use raw unix epoch calculation:
    const epochLastWeek = Math.floor(lastWeek.getTime() / 1000)

    const topPosts = await db
      .select({ title: posts.title, id: posts.id, score: posts.voteScore })
      .from(posts)
      .where(sql`${posts.createdAt} > ${epochLastWeek}`)
      .orderBy(desc(posts.voteScore))
      .limit(5)

    if (topPosts.length === 0) return NextResponse.json({ message: "No trending posts to send" })

    // 2. Fetch users opted into digest
    const subscribersRaw = await db
      .select({ email: users.email, name: users.name })
      .from(emailPreferences)
      .innerJoin(users, eq(emailPreferences.userId, users.id))
      .where(eq(emailPreferences.weeklyDigest, true))

    if (subscribersRaw.length === 0) return NextResponse.json({ message: "No subscribers" })

    // 3. Format email HTML
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://warungilmu.id"
    const postLinksHtml = topPosts.map(p => `<li><a href="${appUrl}/posts/${p.id}">${p.title}</a> (Score: ${p.score})</li>`).join("")

    const htmlBody = `
      <h2>Hai pelajar!</h2>
      <p>Berikut adalah 5 diskusi terpanas di Warung Ilmu minggu ini:</p>
      <ul>${postLinksHtml}</ul>
      <br />
      <p>Tetap semangat belajarnya!</p>
      <p>- Tim Warung Ilmu</p>
    `

    // Limit execution to first 50 per cron batch to avoid timeouts on large tables (simple example)
    const batch = subscribersRaw.slice(0, 50).map(s => s.email)

    // Note: To send to multiple people at once with Resend while maintaining privacy,
    // we use "Bcc" or use Audience/Batch API.
    // Resend free tier allows limited batching. For simplicity, we just send one aggregated BCC email.

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Warung Ilmu <hello@warungilmu.id>',
        to: 'pelajar@warungilmu.id', // Dummy primary to
        bcc: batch,
        subject: '🔥 Top Diskusi Warung Ilmu Minggu Ini',
        html: htmlBody
      })
    } else {
       console.log("No RESEND_API_KEY, skipping email broadcast")
    }

    return NextResponse.json({ message: `Sent to ${batch.length} users` })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
