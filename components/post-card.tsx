"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { SubjectBadge } from "./subject-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import Link from "next/link"
import { motion } from "framer-motion"
import { MessageSquare, ArrowUpCircle, Eye, CheckCircle2, Pin } from "lucide-react"

interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    type: string
    createdAt: Date
    viewCount: number
    voteScore: number
    isSolved: boolean
    isPinned: boolean
    author: {
      name: string
      image: string | null
      reputation: number
    }
    subject: {
      name: string
      color: string
      icon: string
    }
    _count?: {
      comments: number
      bookmarks: number
    }
    tags?: { tag: string }[]
  }
}

export function PostCard({ post }: PostCardProps) {
  // Extract a short snippet
  const snippet = post.content.replace(/[#*_\[\]]/g, '').slice(0, 150) + (post.content.length > 150 ? '...' : '')

  // Reading time estimation
  const wordCount = post.content.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/posts/${post.id}`}>
        <Card className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer border-border/50 shadow-sm hover:shadow-md group relative overflow-hidden">
          {post.isPinned && (
            <div className="absolute top-0 right-0 p-2 text-amber-500">
              <Pin className="w-5 h-5 fill-current" />
            </div>
          )}

          <CardHeader className="pb-3 pt-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8 ring-2 ring-background">
                  <AvatarImage src={post.author.image || ""} />
                  <AvatarFallback>{post.author.name.slice(0,2)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground leading-none">
                    {post.author.name}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: id })}
                    <span className="mx-1">•</span>
                    {readingTime} mnt baca
                  </span>
                </div>
              </div>
              <SubjectBadge name={post.subject.name} color={post.subject.color} icon={post.subject.icon} />
            </div>

            <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>

            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-2 mt-2">
                {post.tags.slice(0, 3).map(t => (
                  <span key={t.tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    #{t.tag}
                  </span>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {snippet}
            </p>
          </CardContent>

          <CardFooter className="pt-0 flex items-center justify-between text-muted-foreground text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <ArrowUpCircle className="w-4 h-4" />
                <span className="font-medium">{post.voteScore}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>{post._count?.comments || 0}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Eye className="w-4 h-4" />
                <span>{post.viewCount}</span>
              </div>
            </div>

            {post.isSolved && (
              <div className="flex items-center text-emerald-500 font-medium text-xs bg-emerald-500/10 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Terjawab
              </div>
            )}
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
