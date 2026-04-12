"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "@/lib/auth-client"
import { Moon, Sun, PenSquare, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function MainNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-14 items-center px-4 sm:px-6 lg:px-8">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-xl bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Warung Ilmu
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/subjects"
              className={`transition-colors hover:text-foreground/80 ${
                pathname === "/subjects" ? "text-foreground" : "text-foreground/60"
              }`}
            >
              Mata Pelajaran
            </Link>
            <Link
              href="/leaderboard"
              className={`transition-colors hover:text-foreground/80 ${
                pathname === "/leaderboard" ? "text-foreground" : "text-foreground/60"
              }`}
            >
              Leaderboard
            </Link>
          </nav>
        </div>

        {/* Mobile Logo */}
        <div className="flex flex-1 md:hidden">
          <Link href="/" className="font-bold text-lg bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Warung Ilmu
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="mr-2"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {session?.user ? (
            <>
              <Button asChild variant="default" size="sm" className="hidden md:flex bg-indigo-600 hover:bg-indigo-700">
                <Link href="/posts/new">
                  <PenSquare className="mr-2 h-4 w-4" />
                  Buat Post
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                      <AvatarFallback>{session.user.name.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${session.user.id}`}>Profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks">Bookmark Saya</Link>
                  </DropdownMenuItem>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(session.user as any).role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Masuk</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700">
                <Link href="/register">Daftar</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
