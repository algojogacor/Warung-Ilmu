"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Bell, User } from "lucide-react"
import { motion } from "framer-motion"
import { useSession } from "@/lib/auth-client"

const navItems = [
  { id: "/", label: "Home", icon: Home },
  { id: "/search", label: "Search", icon: Search },
  { id: "/notifications", label: "Notif", icon: Bell },
  { id: "/profile", label: "Profil", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const items = navItems.map(item => {
    if (item.id === "/profile" && session?.user) {
      return { ...item, id: `/profile/${session.user.id}` }
    }
    return item
  })

  // Basic matching for active tab
  const getActiveTab = () => {
    if (pathname === "/") return "/"
    if (pathname.startsWith("/search")) return "/search"
    if (pathname.startsWith("/notifications")) return "/notifications"
    if (pathname.startsWith("/profile")) return items.find(i => i.label === "Profil")?.id || "/profile"
    return ""
  }

  const activeTab = getActiveTab()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe">
      <nav className="flex justify-around items-center h-16 px-2">
        {items.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon

          return (
            <Link
              key={item.id}
              href={item.id}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-1 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
