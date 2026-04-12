import { db } from "@/lib/db"
import { users, streaks, posts, comments, subjects, bookmarks } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { PostCard } from "@/components/post-card"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import Link from "next/link"

export const dynamic = "force-dynamic"

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
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      createdAt: posts.createdAt,
      viewCount: posts.viewCount,
      voteScore: posts.voteScore,
      isSolved: posts.isSolved,
      isPinned: posts.isPinned,
      author: {
        id: users.id,
        name: users.name,
        image: users.image,
        reputation: users.reputation,
      },
      subject: {
        name: subjects.name,
        color: subjects.color,
        icon: subjects.icon,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(subjects, eq(posts.subjectId, subjects.id))
    .where(eq(posts.authorId, user.id))
    .orderBy(desc(posts.createdAt))

  const userComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      voteScore: comments.voteScore,
      isAcceptedAnswer: comments.isAcceptedAnswer,
      post: {
        id: posts.id,
        title: posts.title,
      }
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(eq(comments.authorId, user.id))
    .orderBy(desc(comments.createdAt))

  const userBookmarks = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      createdAt: posts.createdAt,
      viewCount: posts.viewCount,
      voteScore: posts.voteScore,
      isSolved: posts.isSolved,
      isPinned: posts.isPinned,
      author: {
        id: users.id,
        name: users.name,
        image: users.image,
        reputation: users.reputation,
      },
      subject: {
        name: subjects.name,
        color: subjects.color,
        icon: subjects.icon,
      },
    })
    .from(bookmarks)
    .innerJoin(posts, eq(bookmarks.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(subjects, eq(posts.subjectId, subjects.id))
    .where(eq(bookmarks.userId, user.id))
    .orderBy(desc(bookmarks.createdAt))

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

      <div className="mt-8">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-8">
            <TabsTrigger value="posts">Diskusi ({userPosts.length})</TabsTrigger>
            <TabsTrigger value="comments">Komentar ({userComments.length})</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmark ({userBookmarks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {userPosts.length === 0 ? (
              <div className="text-center py-20 border rounded-xl bg-card text-muted-foreground">
                <p>Belum ada diskusi yang dibuat.</p>
              </div>
            ) : (
              userPosts.map(post => <PostCard key={post.id} post={post} />)
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {userComments.length === 0 ? (
              <div className="text-center py-20 border rounded-xl bg-card text-muted-foreground">
                <p>Belum ada komentar yang diberikan.</p>
              </div>
            ) : (
              userComments.map(comment => (
                <div key={comment.id} className="bg-card border rounded-xl p-4 shadow-sm">
                   <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                     Berkomentar pada:
                     <Link href={`/posts/${comment.post.id}`} className="font-medium text-primary hover:underline">
                        {comment.post.title}
                     </Link>
                     <span className="text-xs ml-auto">
                        {format(new Date(comment.createdAt), "dd MMM yyyy", { locale: localeId })}
                     </span>
                   </div>
                   <div className="prose prose-sm dark:prose-invert max-w-none border-l-2 border-border pl-4 ml-1">
                      <MarkdownRenderer content={comment.content} />
                   </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-4">
            {userBookmarks.length === 0 ? (
              <div className="text-center py-20 border rounded-xl bg-card text-muted-foreground">
                <p>Belum ada bookmark yang disimpan.</p>
              </div>
            ) : (
              userBookmarks.map(post => <PostCard key={post.id} post={post} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
