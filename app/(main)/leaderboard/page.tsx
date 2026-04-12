import { db } from "@/lib/db"
import { users, streaks } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage() {
  const topUsers = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      reputation: users.reputation,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
    })
    .from(users)
    .leftJoin(streaks, eq(users.id, streaks.userId))
    .orderBy(desc(users.reputation))
    .limit(50)

  return (
    <div className="py-6 max-w-3xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
          Leaderboard Sepanjang Masa
        </h1>
        <p className="text-muted-foreground">
          Peringkat top 50 kontributor Warung Ilmu yang telah membantu ribuan pelajar lainnya.
        </p>
      </header>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-6">Pengguna</div>
          <div className="col-span-3 text-center">Reputasi</div>
          <div className="col-span-2 text-center">Streak 🔥</div>
        </div>

        <div className="divide-y divide-border">
          {topUsers.map((user, index) => {
            const rank = index + 1
            const isTop3 = rank <= 3
            let rankColor = "text-muted-foreground"
            let badgeBg = "bg-muted"
            if (rank === 1) { rankColor = "text-yellow-500"; badgeBg = "bg-yellow-500/10 border border-yellow-500/20" }
            else if (rank === 2) { rankColor = "text-slate-400"; badgeBg = "bg-slate-400/10 border border-slate-400/20" }
            else if (rank === 3) { rankColor = "text-amber-700"; badgeBg = "bg-amber-700/10 border border-amber-700/20" }

            return (
              <Link key={user.id} href={`/profile/${user.id}`}>
                <div className="group grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
                  <div className={`col-span-2 sm:col-span-1 text-center font-bold text-lg sm:text-xl ${rankColor}`}>
                    #{rank}
                  </div>

                  <div className="col-span-7 sm:col-span-6 flex items-center gap-3">
                    <Avatar className={`w-10 h-10 ${isTop3 ? "ring-2 ring-offset-2 ring-background " + badgeBg : ""}`}>
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold truncate group-hover:text-primary transition-colors">
                        {user.name}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${isTop3 ? badgeBg + " " + rankColor : "bg-primary/10 text-primary"}`}>
                      {user.reputation}
                    </span>
                  </div>

                  <div className="col-span-12 sm:col-span-2 flex justify-end sm:justify-center items-center gap-1 text-sm font-medium text-orange-500 mt-2 sm:mt-0">
                    <span className="sm:hidden text-muted-foreground font-normal">Streak:</span>
                    🔥 {user.currentStreak || 0}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
