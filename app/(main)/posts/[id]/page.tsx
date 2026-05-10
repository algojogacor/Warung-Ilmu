import { db } from "@/lib/db"
import { posts, users, subjects, votes, comments } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { notFound } from "next/navigation"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { SubjectBadge } from "@/components/subject-badge"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VoteButtons } from "@/components/vote-buttons"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { CommentsSection } from "@/components/comments-section"
import { desc } from "drizzle-orm"
import { PostActionButtons } from "@/components/post-action-buttons"

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id

  // Fetch Post
  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      createdAt: posts.createdAt,
      viewCount: posts.viewCount,
      voteScore: posts.voteScore,
      authorId: posts.authorId,
      isAnonymous: posts.isAnonymous,
      authorName: users.name,
      authorImage: users.image,
      subjectName: subjects.name,
      subjectColor: subjects.color,
      subjectIcon: subjects.icon,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(subjects, eq(posts.subjectId, subjects.id))
    .where(eq(posts.id, params.id))

  if (!post) {
    notFound()
  }

  // Increment view count (Simple update on view)
  // Usually this is rate-limited or handled separately, but we do it simply here.
  await db.update(posts).set({ viewCount: post.viewCount + 1 }).where(eq(posts.id, post.id))

  // Determine user's interactions
  let userVote: 1 | -1 | 0 = 0
  let isBookmarkedInitial = false
  if (userId) {
    const [vote] = await db.select().from(votes).where(and(eq(votes.postId, post.id), eq(votes.userId, userId)))
    if (vote) userVote = vote.value as 1 | -1

    // Lazy import bookmarks to avoid circular dependency in Drizzle if any
    const { bookmarks } = await import("@/lib/db/schema")
    const [bm] = await db.select().from(bookmarks).where(and(eq(bookmarks.postId, post.id), eq(bookmarks.userId, userId)))
    if (bm) isBookmarkedInitial = true
  }

  // Fetch Comments
  const commentsListRaw = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      voteScore: comments.voteScore,
      isAcceptedAnswer: comments.isAcceptedAnswer,
      parentId: comments.parentId,
      author: {
        id: users.id,
        name: users.name,
        image: users.image,
        reputation: users.reputation,
      },
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, post.id))
    .orderBy(desc(comments.isAcceptedAnswer), desc(comments.voteScore), desc(comments.createdAt))

  // Fetch all user's comment votes for this post in a single query
  let commentVotesMap: Record<string, 1 | -1> = {}
  if (userId && commentsListRaw.length > 0) {
    const commentIds = commentsListRaw.map(c => c.id)
    const userCommentVotes = await db
      .select({ commentId: votes.commentId, value: votes.value })
      .from(votes)
      .where(and(eq(votes.userId, userId), inArray(votes.commentId, commentIds as string[])))

    commentVotesMap = userCommentVotes.reduce((acc, v) => {
      if (v.commentId) acc[v.commentId] = v.value as 1 | -1
      return acc
    }, {} as Record<string, 1 | -1>)
  }

  const commentsList = commentsListRaw.map(c => ({
    ...c,
    userVote: commentVotesMap[c.id] || 0
  }))

  return (
    <div className="py-6 flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
      {/* Left side: Vote Buttons */}
      <div className="hidden md:flex flex-col items-center shrink-0 w-16">
        <div className="sticky top-20">
          <VoteButtons
            postId={post.id}
            initialScore={post.voteScore}
            userVote={userVote}
            isLoggedIn={!!userId}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-8 min-w-0">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <SubjectBadge name={post.subjectName} color={post.subjectColor} icon={post.subjectIcon} />
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: id })}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between border-b border-border/50 pb-6">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-background">
                {post.isAnonymous ? (
                  <AvatarFallback>?</AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={post.authorImage || ""} />
                    <AvatarFallback>{post.authorName.slice(0,2)}</AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {post.isAnonymous ? "Anonim" : post.authorName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {post.isAnonymous ? "Menyembunyikan identitas" : "Member Warung Ilmu"}
                </span>
              </div>
            </div>

            {/* Mobile Vote Buttons inline */}
            <div className="md:hidden flex items-center">
               <VoteButtons
                postId={post.id}
                initialScore={post.voteScore}
                userVote={userVote}
                isLoggedIn={!!userId}
              />
            </div>
          </div>
        </header>

        <div className="pt-2">
          <MarkdownRenderer content={post.content} />
        </div>

        <PostActionButtons postId={post.id} isBookmarkedInitial={isBookmarkedInitial} />

        {/* Comment Section */}
        <div className="border-t border-border pt-8 mt-12">
          <h2 className="text-2xl font-bold mb-6">Diskusi & Jawaban</h2>
          <CommentsSection
            postId={post.id}
            postType={post.type}
            isPostAuthor={post.authorId === userId}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialComments={commentsList as any}
          />
        </div>
      </div>
    </div>
  )
}
