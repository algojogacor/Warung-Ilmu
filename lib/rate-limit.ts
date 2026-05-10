import { db } from "./db"
import { rateLimits } from "./db/schema"
import { eq, sql } from "drizzle-orm"

interface RateLimitConfig {
  key: string
  limit: number
  windowMs: number
}

export async function checkRateLimit({ key, limit, windowMs }: RateLimitConfig) {
  const now = new Date()

  const [record] = await db.select().from(rateLimits).where(eq(rateLimits.key, key))

  if (!record) {
    const resetAt = new Date(now.getTime() + windowMs)
    await db.insert(rateLimits).values({
      key,
      count: 1,
      resetAt
    })
    return { success: true }
  }

  if (now > record.resetAt) {
    // Window expired, reset
    const resetAt = new Date(now.getTime() + windowMs)
    await db.update(rateLimits).set({
      count: 1,
      resetAt
    }).where(eq(rateLimits.key, key))
    return { success: true }
  }

  if (record.count >= limit) {
    // Rate limited
    const resetInMs = record.resetAt.getTime() - now.getTime()
    return {
      success: false,
      resetInMinutes: Math.ceil(resetInMs / 60000)
    }
  }

  // Increment
  await db.update(rateLimits)
    .set({ count: sql`${rateLimits.count} + 1` })
    .where(eq(rateLimits.key, key))

  return { success: true }
}
