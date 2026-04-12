"use client"

import { useState } from "react"
import { Bell, Check, MessageSquare, ArrowUpCircle, CheckCircle2, UserCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from "@/server/actions/notification"
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"

type NotifData = {
  id: string
  type: string
  message: string
  link: string
  isRead: boolean
  createdAt: Date
}

export function NotificationBell({ initialCount, initialNotifs }: { initialCount: number, initialNotifs: NotifData[] }) {
  const [notifs, setNotifs] = useState(initialNotifs)
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleMarkAsRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    await markNotificationAsReadAction(id)
  }

  const handleMarkAllAsRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    await markAllNotificationsAsReadAction()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "comment": return <MessageSquare className="w-4 h-4 text-blue-500" />
      case "reply": return <MessageSquare className="w-4 h-4 text-blue-400" />
      case "vote": return <ArrowUpCircle className="w-4 h-4 text-orange-500" />
      case "accepted_answer": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case "mention": return <UserCircle2 className="w-4 h-4 text-purple-500" />
      default: return <Bell className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative mr-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifikasi</span>
          {unreadCount > 0 && (
             <button onClick={handleMarkAllAsRead} className="text-xs text-primary hover:underline flex items-center">
                <Check className="w-3 h-3 mr-1" /> Tandai dibaca
             </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Belum ada notifikasi</div>
          ) : (
            notifs.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.isRead) handleMarkAsRead(notif.id)
                  setOpen(false)
                  router.push(notif.link)
                }}
                className={`p-3 border-b border-border/50 hover:bg-muted/50 cursor-pointer flex gap-3 ${!notif.isRead ? "bg-primary/5" : ""}`}
              >
                <div className="mt-1 shrink-0">{getIcon(notif.type)}</div>
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{notif.message}</p>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: localeId })}
                  </span>
                </div>
                {!notif.isRead && <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-2"></div>}
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t text-center">
          <Link href="/notifications" className="text-xs text-muted-foreground hover:text-primary transition-colors" onClick={() => setOpen(false)}>
            Lihat semua notifikasi
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}