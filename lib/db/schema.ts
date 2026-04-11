import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Using better-auth default string ID
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  role: text('role').default('user').notNull(),
  bio: text('bio'),
  reputation: integer('reputation').default(0).notNull(),
  isSuspended: integer('isSuspended', { mode: 'boolean' }).default(false).notNull(),
  isShadowBanned: integer('isShadowBanned', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => users.id)
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => users.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
});

export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  description: text('description').notNull()
});

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(), // discussion, question, tip, summary
  subjectId: text('subjectId').notNull().references(() => subjects.id),
  authorId: text('authorId').notNull().references(() => users.id),
  isPinned: integer('isPinned', { mode: 'boolean' }).default(false).notNull(),
  isSolved: integer('isSolved', { mode: 'boolean' }).default(false).notNull(),
  isDraft: integer('isDraft', { mode: 'boolean' }).default(false).notNull(),
  isAnonymous: integer('isAnonymous', { mode: 'boolean' }).default(false).notNull(),
  viewCount: integer('viewCount').default(0).notNull(),
  voteScore: integer('voteScore').default(0).notNull(),
  editedAt: integer('editedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const postTags = sqliteTable('post_tags', {
  postId: text('postId').notNull().references(() => posts.id),
  tag: text('tag').notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tag] })
}));

export const comments = sqliteTable('comments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  content: text('content').notNull(),
  postId: text('postId').notNull().references(() => posts.id),
  authorId: text('authorId').notNull().references(() => users.id),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentId: text('parentId').references((): any => comments.id),
  isAcceptedAnswer: integer('isAcceptedAnswer', { mode: 'boolean' }).default(false).notNull(),
  voteScore: integer('voteScore').default(0).notNull(),
  editedAt: integer('editedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const votes = sqliteTable('votes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id),
  postId: text('postId').references(() => posts.id),
  commentId: text('commentId').references(() => comments.id),
  value: integer('value').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const bookmarkFolders = sqliteTable('bookmark_folders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id),
  name: text('name').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const bookmarks = sqliteTable('bookmarks', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id),
  postId: text('postId').notNull().references(() => posts.id),
  folderId: text('folderId').references(() => bookmarkFolders.id),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id),
  type: text('type').notNull(), // comment, reply, vote, accepted_answer, mention
  message: text('message').notNull(),
  link: text('link').notNull(),
  isRead: integer('isRead', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  reporterId: text('reporterId').notNull().references(() => users.id),
  postId: text('postId').references(() => posts.id),
  commentId: text('commentId').references(() => comments.id),
  reason: text('reason').notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const editHistory = sqliteTable('edit_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  postId: text('postId').references(() => posts.id),
  commentId: text('commentId').references(() => comments.id),
  previousContent: text('previousContent').notNull(),
  editedAt: integer('editedAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const emailPreferences = sqliteTable('email_preferences', {
  userId: text('userId').primaryKey().references(() => users.id),
  weeklyDigest: integer('weeklyDigest', { mode: 'boolean' }).default(true).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  resetAt: integer('resetAt', { mode: 'timestamp' }).notNull()
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  adminId: text('adminId').notNull().references(() => users.id),
  action: text('action').notNull(),
  targetId: text('targetId').notNull(),
  targetType: text('targetType').notNull(),
  metadata: text('metadata'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const streaks = sqliteTable('streaks', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id),
  currentStreak: integer('currentStreak').default(0).notNull(),
  longestStreak: integer('longestStreak').default(0).notNull(),
  lastActivityDate: text('lastActivityDate'),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});
