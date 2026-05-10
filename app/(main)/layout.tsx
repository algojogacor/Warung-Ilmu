import { PageTransition } from "@/components/page-transition"
import { MainNav } from "@/components/main-nav"
import { BottomNav } from "@/components/bottom-nav"
import React from "react"

export const dynamic = "force-dynamic"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1 pb-16 md:pb-0 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <BottomNav />
    </div>
  )
}