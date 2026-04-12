import { db } from "@/lib/db"
import { users, streaks, posts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      reputation: users.reputation,
      bio: users.bio,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, params.userId))

  if (!user) notFound()

  const [streak] = await db.select().from(streaks).where(eq(streaks.userId, user.id))

  const userPosts = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.authorId, user.id))

  // Simplified badge rank logic
  let badgeLabel = "Pemula"
  let badgeColor = "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  if (user.reputation >= 100) { badgeLabel = "Pintar"; badgeColor = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" }
  if (user.reputation >= 500) { badgeLabel = "Ahli"; badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" }
  if (user.reputation >= 1000) { badgeLabel = "Master"; badgeColor = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" }
  if (user.reputation >= 5000) { badgeLabel = "Legenda"; badgeColor = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" }

  return (
    <div className="py-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-card rounded-xl border p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
          <AvatarImage src={user.image || ""} />
          <AvatarFallback className="text-2xl">{user.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.bio || "Belum ada bio."}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 text-sm">
             <span className={`px-3 py-1 rounded-full font-medium ${badgeColor}`}>
               {badgeLabel}
             </span>
             <span className="font-medium flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full">
                Reputasi: {user.reputation}
             </span>
             <span className="text-muted-foreground">
                Bergabung {format(new Date(user.createdAt), "MMMM yyyy", { locale: localeId })}
             </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-2 text-center">
          <h3 className="font-semibold text-muted-foreground">Total Diskusi</h3>
          <p className="text-4xl font-bold">{userPosts.length}</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-2 text-center">
          <h3 className="font-semibold text-muted-foreground flex items-center justify-center gap-1">
             Streak Saat Ini 🔥
          </h3>
          <p className="text-4xl font-bold text-orange-500">{streak?.currentStreak || 0}</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-2 text-center">
          <h3 className="font-semibold text-muted-foreground flex items-center justify-center gap-1">
             Streak Terlama 👑
          </h3>
          <p className="text-4xl font-bold text-amber-500">{streak?.longestStreak || 0}</p>
        </div>
      </div>
    </div>
  )
}
