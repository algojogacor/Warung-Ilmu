import { MainNav } from "@/components/main-nav"
import React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  // Extra guard on layout level
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session as any).user.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-900">
      <MainNav />
      <main className="flex-1 w-full bg-background rounded-tl-3xl shadow-inner border-t border-l mt-4 min-h-screen">
        {children}
      </main>
    </div>
  )
}
