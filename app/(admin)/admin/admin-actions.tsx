"use client"

import { useState } from "react"
import { deletePostAction, shadowBanUserAction, resolveReportAction } from "@/server/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminActions() {
  const [postId, setPostId] = useState("")
  const [userId, setUserId] = useState("")
  const [reportId, setReportId] = useState("")

  const handleDeletePost = async () => {
    if (!postId) return
    const res = await deletePostAction(postId)
    if (res.success) toast.success("Post deleted")
    setPostId("")
  }

  const handleShadowban = async (status: boolean) => {
    if (!userId) return
    const res = await shadowBanUserAction(userId, status)
    if (res.success) toast.success(`User shadowban: ${status}`)
    setUserId("")
  }

  const handleResolveReport = async (status: "resolved" | "dismissed") => {
    if (!reportId) return
    const res = await resolveReportAction(reportId, status)
    if (res.success) toast.success(`Report status: ${status}`)
    setReportId("")
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-8 mt-8">
       <Card>
          <CardHeader><CardTitle className="text-lg">Hapus Post</CardTitle></CardHeader>
          <CardContent className="space-y-3">
             <Input placeholder="ID Post..." value={postId} onChange={e=>setPostId(e.target.value)} />
             <Button variant="destructive" className="w-full" onClick={handleDeletePost}>Hapus Postingan</Button>
          </CardContent>
       </Card>

       <Card>
          <CardHeader><CardTitle className="text-lg">Shadowban User</CardTitle></CardHeader>
          <CardContent className="space-y-3">
             <Input placeholder="ID User..." value={userId} onChange={e=>setUserId(e.target.value)} />
             <div className="flex gap-2">
                <Button variant="destructive" className="w-full" onClick={()=>handleShadowban(true)}>Ban</Button>
                <Button variant="outline" className="w-full" onClick={()=>handleShadowban(false)}>Un-ban</Button>
             </div>
          </CardContent>
       </Card>

       <Card>
          <CardHeader><CardTitle className="text-lg">Resolve Report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
             <Input placeholder="ID Report..." value={reportId} onChange={e=>setReportId(e.target.value)} />
             <div className="flex gap-2">
                <Button variant="default" className="w-full" onClick={()=>handleResolveReport("resolved")}>Resolve</Button>
                <Button variant="outline" className="w-full" onClick={()=>handleResolveReport("dismissed")}>Dismiss</Button>
             </div>
          </CardContent>
       </Card>
    </div>
  )
}
