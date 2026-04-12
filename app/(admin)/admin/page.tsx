import { db } from "@/lib/db"
import { users, posts, comments, reports, auditLogs } from "@/lib/db/schema"
import { count, eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { AdminActions } from "./admin-actions"

export default async function AdminDashboardPage() {
  const [totalUsers] = await db.select({ value: count() }).from(users)
  const [totalPosts] = await db.select({ value: count() }).from(posts)
  const [totalComments] = await db.select({ value: count() }).from(comments)
  const [pendingReports] = await db.select({ value: count() }).from(reports).where(eq(reports.status, 'pending'))

  const recentLogs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      createdAt: auditLogs.createdAt,
      adminName: users.name,
    })
    .from(auditLogs)
    .innerJoin(users, eq(auditLogs.adminId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(10)

  return (
    <div className="py-6 max-w-6xl mx-auto space-y-8 px-4">
      <header>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Ringkasan aktivitas platform Warung Ilmu.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Pengguna</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalUsers.value}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Diskusi</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalPosts.value}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Jawaban</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalComments.value}</div></CardContent>
        </Card>
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-orange-600">Laporan Menunggu</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-orange-600">{pendingReports.value}</div></CardContent>
        </Card>
      </div>

      <AdminActions />

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Audit Logs Terbaru</h2>
        <div className="bg-card rounded-xl border shadow-sm divide-y">
          {recentLogs.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Belum ada catatan aktivitas admin.</div>
          ) : (
            recentLogs.map(log => (
              <div key={log.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold">{log.adminName}</span> melakukan aksi <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{log.action}</span> pada {log.targetType}
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: localeId })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
