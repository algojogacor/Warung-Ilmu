"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPostAction } from "@/server/actions/post"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CreatePostFormProps {
  subjects: { id: string; name: string; icon: string }[]
}

export default function CreatePostForm({ subjects }: CreatePostFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState<string>("discussion")
  const [subjectId, setSubjectId] = useState<string>("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()

    if (!subjectId) {
      toast.error("Pilih mata pelajaran terlebih dahulu")
      return
    }

    setLoading(true)
    const res = await createPostAction({
      title,
      content,
      type,
      subjectId,
      isDraft,
      isAnonymous,
    })
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.id) {
      toast.success(isDraft ? "Draft berhasil disimpan" : "Post berhasil dipublikasikan!")
      if (!isDraft) {
        router.push(`/posts/${res.id}`)
      }
    }
  }

  // Helper for quick markdown insertion
  const insertText = (before: string, after: string = "") => {
    const el = document.getElementById("content-textarea") as HTMLTextAreaElement
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = content.substring(start, end)

    const newContent = content.substring(0, start) + before + selected + after + content.substring(end)
    setContent(newContent)

    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Topik</Label>
            <Input
              id="title"
              placeholder="Contoh: Bagaimana cara menghitung integral tentu?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Minimal 10 karakter.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Tipe Topik</Label>
              <RadioGroup
                value={type}
                onValueChange={setType}
                className="flex flex-wrap gap-2"
              >
                <div className="flex items-center space-x-2 border rounded-md px-3 py-2 cursor-pointer bg-card hover:bg-muted/50">
                  <RadioGroupItem value="discussion" id="discussion" />
                  <Label htmlFor="discussion" className="cursor-pointer">Diskusi</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md px-3 py-2 cursor-pointer bg-card hover:bg-muted/50">
                  <RadioGroupItem value="question" id="question" />
                  <Label htmlFor="question" className="cursor-pointer">Pertanyaan</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md px-3 py-2 cursor-pointer bg-card hover:bg-muted/50">
                  <RadioGroupItem value="tip" id="tip" />
                  <Label htmlFor="tip" className="cursor-pointer">Tips</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md px-3 py-2 cursor-pointer bg-card hover:bg-muted/50">
                  <RadioGroupItem value="summary" id="summary" />
                  <Label htmlFor="summary" className="cursor-pointer">Ringkasan</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Mata Pelajaran</Label>
              <Select value={subjectId} onValueChange={setSubjectId} required>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Pilih Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Isi Konten</Label>

            <Tabs defaultValue="edit" className="w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <TabsList>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                {/* Toolbar Editor */}
                <div className="hidden sm:flex items-center gap-1" aria-label="Markdown styling toolbar">
                  <Button type="button" variant="ghost" size="sm" onClick={() => insertText("**", "**")} title="Bold" aria-label="Insert Bold Text">B</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => insertText("_", "_")} title="Italic" aria-label="Insert Italic Text">I</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => insertText("### ", "")} title="Heading" aria-label="Insert Heading">H</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => insertText("$$ \n", "\n$$")} title="Math" aria-label="Insert Math Equation">∑</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => insertText("```\n", "\n```")} title="Code" aria-label="Insert Code Block">{"<>"}</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => insertText("[Teks Link](https://)", "")} title="Link" aria-label="Insert Hyperlink">🔗</Button>
                </div>
              </div>

              <TabsContent value="edit" className="mt-4">
                <Textarea
                  id="content-textarea"
                  placeholder="Tuliskan isi diskusimu di sini (Mendukung format Markdown, LaTeX untuk matematika, dan link YouTube langsung render video)"
                  className="min-h-[300px] font-mono text-sm resize-y"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Minimal 30 karakter. Auto-save ke draft akan segera hadir.
                </p>
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <div className="min-h-[300px] border rounded-md p-4 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
                  {content ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <p className="text-muted-foreground italic">Belum ada konten untuk dipreview...</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <Label htmlFor="anonymous" className="cursor-pointer">Post sebagai Anonim</Label>
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" disabled={loading} onClick={(e) => handleSubmit(e, true)}>
                Simpan Draft
              </Button>
              <Button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading}>
                {loading ? "Memproses..." : "Publikasikan"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
