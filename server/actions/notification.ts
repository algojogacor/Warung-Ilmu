"use server"

import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function markNotificationAsReadAction(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)))

  revalidatePath("/notifications")
  return { success: true }
}

export async function markAllNotificationsAsReadAction() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, session.user.id))

  revalidatePath("/notifications")
  return { success: true }
}
