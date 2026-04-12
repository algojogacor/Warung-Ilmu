import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Bell, MessageSquare, ArrowUpCircle, CheckCircle2, UserCircle2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Harap Masuk</h1>
        <p className="text-muted-foreground">Silahkan masuk untuk melihat notifikasi Anda.</p>
      </div>
    )
  }

  const notifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50)

  const getIcon = (type: string) => {
    switch (type) {
      case "comment": return <MessageSquare className="w-5 h-5 text-blue-500" />
      case "reply": return <MessageSquare className="w-5 h-5 text-blue-400" />
      case "vote": return <ArrowUpCircle className="w-5 h-5 text-orange-500" />
      case "accepted_answer": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case "mention": return <UserCircle2 className="w-5 h-5 text-purple-500" />
      default: return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  return (
    <div className="py-6 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
      </header>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden divide-y divide-border">
        {notifs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <Bell className="w-12 h-12 mb-4 opacity-20" />
            <p>Belum ada notifikasi.</p>
          </div>
        ) : (
          notifs.map(notif => (
            <Link key={notif.id} href={notif.link} className={`block p-4 hover:bg-muted/50 transition-colors flex gap-4 ${!notif.isRead ? 'bg-primary/5' : ''}`}>
              <div className="mt-1 shrink-0 bg-background p-2 rounded-full border shadow-sm">
                 {getIcon(notif.type)}
              </div>
              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <p className={`text-sm ${!notif.isRead ? 'font-semibold' : ''}`}>{notif.message}</p>
                <span className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: localeId })}
                </span>
              </div>
              {!notif.isRead && (
                <div className="flex items-center shrink-0">
                   <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
