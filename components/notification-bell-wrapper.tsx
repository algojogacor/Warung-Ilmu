import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { NotificationBell } from "./notification-bell"

// This is a server component wrapper to fetch initial data for the client component
export async function NotificationBellWrapper({ userId }: { userId: string }) {
  const userNotifs = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(10)

  const unreadCount = userNotifs.filter(n => !n.isRead).length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <NotificationBell initialCount={unreadCount} initialNotifs={userNotifs as any} />
}
