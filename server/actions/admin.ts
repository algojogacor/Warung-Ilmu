"use server"

import { db } from "@/lib/db"
import { posts, comments, users, reports, auditLogs } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function verifyAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session as any).user.role !== "admin") {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

async function logAudit(adminId: string, action: string, targetType: string, targetId: string) {
  await db.insert(auditLogs).values({
    adminId,
    action,
    targetType,
    targetId,
  })
}

export async function deletePostAction(postId: string) {
  const adminId = await verifyAdmin()

  await db.delete(posts).where(eq(posts.id, postId))
  await logAudit(adminId, "delete_post", "post", postId)

  revalidatePath("/")
  return { success: true }
}

export async function shadowBanUserAction(userId: string, shadowBanState: boolean) {
  const adminId = await verifyAdmin()

  await db.update(users).set({ isShadowBanned: shadowBanState }).where(eq(users.id, userId))
  await logAudit(adminId, shadowBanState ? "shadowban_user" : "unshadowban_user", "user", userId)

  revalidatePath("/")
  return { success: true }
}

export async function resolveReportAction(reportId: string, status: "resolved" | "dismissed") {
  const adminId = await verifyAdmin()

  await db.update(reports).set({ status }).where(eq(reports.id, reportId))
  await logAudit(adminId, `resolve_report_${status}`, "report", reportId)

  revalidatePath("/admin")
  return { success: true }
}
