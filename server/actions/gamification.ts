import { db } from "@/lib/db"
import { streaks } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function processUserStreak(userId: string) {
  const todayDate = new Date()
  // Use local ISO format YYYY-MM-DD
  const todayStr = todayDate.toISOString().split("T")[0]

  const yesterdayDate = new Date(todayDate)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0]

  const [streak] = await db.select().from(streaks).where(eq(streaks.userId, userId))

  if (!streak) {
    // First time activity
    await db.insert(streaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: todayStr
    })
    return
  }

  if (streak.lastActivityDate === todayStr) {
    // Already active today
    return
  }

  if (streak.lastActivityDate === yesterdayStr) {
    // Continued streak
    const newStreak = streak.currentStreak + 1
    const newLongest = Math.max(newStreak, streak.longestStreak)
    await db.update(streaks)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: todayStr
      })
      .where(eq(streaks.id, streak.id))
  } else {
    // Streak broken
    await db.update(streaks)
      .set({
        currentStreak: 1,
        lastActivityDate: todayStr
      })
      .where(eq(streaks.id, streak.id))
  }
}
