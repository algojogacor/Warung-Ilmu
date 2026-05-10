"use server"

import { db } from "@/lib/db"
import { reports } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function reportAction(targetId: string, type: "post" | "comment", reason: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: "Unauthorized" }

  await db.insert(reports).values({
    reporterId: session.user.id,
    postId: type === "post" ? targetId : null,
    commentId: type === "comment" ? targetId : null,
    reason,
  })

  return { success: true }
}
