# Implementation Log - Warung Ilmu

## Scaffold Next.js Project
- Initialized Next.js 14 project using App Router, TypeScript, Tailwind CSS, and ESLint.
- No `src/` directory, per project structure guidelines.

## Scaffold Drizzle & Better Auth
- Scaffolded Drizzle schema and configured `drizzle.config.ts`.
- Manually generated SQLite FTS5 trigger for `posts_fts`.
- Configured Better Auth along with Google OAuth logic.
- Scaffolded core configuration of PWA.
- Set up Gen-Z style colors using Tailwind CSS configurations.

## Implement Seed Data and Components
- Created `lib/db/seed.ts` script to populate initial Subjects and an admin user with sample posts.
- Build Authentication Pages (Login & Register) using Better Auth.
- Created `middleware.ts` to manage route protection and authorization for Admin routes.
- Built Core UI Components: MarkdownRenderer (with KaTeX, Syntax Highlighting, and Sanitize), YouTubeEmbed.
- Configured Gen-Z UI elements with Main Layout, Navigation (Top & Bottom Mobile Nav), and Framer Motion PageTransitions.
