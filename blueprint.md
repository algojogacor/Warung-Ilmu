# BLUEPRINT.md — Warung Ilmu

## Deskripsi
Platform forum akademik berbasis komunitas untuk pelajar SMA dan peserta UTBK.
Pengguna bisa membuat post berisi pembahasan soal, ringkasan materi, atau tips belajar.
Konten diorganisir per mata pelajaran dan topik.
Desain modern, penuh animasi, dan terasa native untuk Gen Z.

---

## Tech Stack
- Framework: Next.js 14 (App Router)
- Database: Turso (LibSQL)
- ORM: Drizzle ORM
- Auth: Better Auth
- UI: Tailwind CSS + shadcn/ui
- Animasi: Framer Motion
- Deploy: Vercel
- Search: SQLite FTS5 (built-in Turso)
- Upload gambar: Cloudinary
- YouTube embed: react-lite-youtube-embed (lazy, no cookie)

---

## Skema Database (Drizzle)

### users
- id (text, PK)
- name (text)
- email (text, unique)
- emailVerified (boolean)
- image (text, nullable)
- role (text, default: "user") — "user" | "admin"
- bio (text, nullable)
- reputation (integer, default: 0)
- isSuspended (boolean, default: false)
- createdAt (timestamp)
- updatedAt (timestamp)

### sessions, accounts, verifications
(generate otomatis oleh Better Auth — jangan dibuat manual)

### subjects
- id (text, PK)
- name (text) — contoh: "Matematika", "Fisika"
- slug (text, unique)
- icon (text) — emoji
- color (text) — hex color untuk badge
- description (text)

### posts
- id (text, PK, cuid2)
- title (text)
- content (text) — markdown, bisa mengandung URL YouTube
- type (text) — "discussion" | "question" | "tip" | "summary"
- subjectId (text, FK -> subjects)
- authorId (text, FK -> users)
- isPinned (boolean, default: false)
- isSolved (boolean, default: false)
- viewCount (integer, default: 0)
- voteScore (integer, default: 0)
- createdAt (timestamp)
- updatedAt (timestamp)

### post_tags
- postId (text, FK -> posts)
- tag (text)

### votes
- id (text, PK)
- userId (text, FK -> users)
- postId (text, nullable FK -> posts)
- commentId (text, nullable FK -> comments)
- value (integer) — 1 atau -1
- createdAt (timestamp)
- UNIQUE(userId, postId) dan UNIQUE(userId, commentId)

### comments
- id (text, PK, cuid2)
- content (text) — markdown
- postId (text, FK -> posts)
- authorId (text, FK -> users)
- parentId (text, nullable FK -> comments)
- isAcceptedAnswer (boolean, default: false)
- voteScore (integer, default: 0)
- createdAt (timestamp)
- updatedAt (timestamp)

### bookmarks
- id (text, PK)
- userId (text, FK -> users)
- postId (text, FK -> posts)
- createdAt (timestamp)
- UNIQUE(userId, postId)

### notifications
- id (text, PK)
- userId (text, FK -> users)
- type (text) — "comment" | "reply" | "vote" | "accepted_answer"
- message (text)
- link (text)
- isRead (boolean, default: false)
- createdAt (timestamp)

### reports
- id (text, PK)
- reporterId (text, FK -> users)
- postId (text, nullable)
- commentId (text, nullable)
- reason (text)
- status (text) — "pending" | "resolved" | "dismissed"
- createdAt (timestamp)

---

## Struktur Folder

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (main)/
    layout.tsx
    page.tsx                   ← home feed
    posts/
      [id]/page.tsx            ← detail post + komentar
      new/page.tsx             ← buat post baru
    subjects/
      page.tsx
      [slug]/page.tsx
    search/page.tsx
    bookmarks/page.tsx
    profile/
      [userId]/page.tsx
    leaderboard/page.tsx
  (admin)/
    layout.tsx
    admin/
      page.tsx
      posts/page.tsx
      reports/page.tsx
      users/page.tsx

components/
  ui/                          ← shadcn components
  post-card.tsx
  comment-item.tsx
  vote-buttons.tsx
  subject-badge.tsx
  notification-bell.tsx
  markdown-editor.tsx
  markdown-renderer.tsx        ← termasuk YouTube embed detection
  youtube-embed.tsx            ← komponen YouTube lazy embed
  search-bar.tsx
  user-avatar.tsx
  reputation-badge.tsx
  page-transition.tsx          ← Framer Motion wrapper
  animated-counter.tsx

lib/
  db/
    index.ts
    schema.ts
    migrations/
  auth.ts
  utils.ts
  reputation.ts
  youtube.ts                   ← helper extract YouTube ID dari URL

server/
  actions/
    post.ts
    comment.ts
    vote.ts
    bookmark.ts
    notification.ts
    report.ts
  queries/
    post.ts
    user.ts
    subject.ts
```

---

## Halaman & Fitur Detail

### 1. Home Feed (`/`)
- Infinite scroll menggunakan Intersection Observer
- Filter bar: Semua | Pertanyaan | Diskusi | Tips | Ringkasan
- Sort: Terbaru | Terpopuler | Belum Terjawab
- Sidebar kanan: Subject list, Top contributors minggu ini, Tags populer
- Skeleton loader saat loading (bukan spinner)

### 2. Post Card (komponen)
Tampilkan:
- Avatar + nama author + badge reputasi
- Title post
- Subject badge (warna sesuai subject)
- Tags (maksimal 3 ditampilkan)
- Snippet content (max 2 baris)
- Jumlah vote, komentar, bookmark, view
- Label "Terjawab" jika isSolved = true
- Label "Pinned" jika isPinned = true
- Waktu relatif ("2 jam lalu")
- Thumbnail preview YouTube jika konten mengandung URL YouTube

### 3. Detail Post (`/posts/[id]`)
- Render konten markdown
- Deteksi URL YouTube otomatis: jika ada URL YouTube di dalam
  konten (standalone di baris sendiri atau dalam format
  [teks](url)), render sebagai YouTube embed menggunakan
  react-lite-youtube-embed. URL YouTube yang didukung:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
  Embed tampil dengan thumbnail lazy-load, klik untuk play
  (tidak autoplay). Gunakan mode no-cookie
  (youtube-nocookie.com) untuk privasi.
- Syntax highlighting untuk code block (rehype-highlight)
- Tombol upvote/downvote (hanya user login)
- Tombol bookmark dengan animasi
- Tombol share (copy link + toast konfirmasi)
- Tombol report
- Section komentar:
  - Nested reply 1 level
  - Sort: Terpopuler | Terbaru
  - Tombol "Tandai Jawaban Terbaik" (hanya author post + type question)
  - isAcceptedAnswer ditampilkan paling atas dengan highlight
- Related posts (same subject + tags)

### 4. Buat Post (`/posts/new`)
- Input: Title, Type (radio pill), Subject (dropdown), Tags,
  Content (markdown editor + preview split)
- Markdown editor toolbar: bold, italic, heading, code block,
  blockquote, list, insert gambar (Cloudinary), insert YouTube
  (paste URL langsung terdeteksi dan dipreview live)
- Validasi: title min 10 char, content min 30 char
- Preview real-time di sisi kanan (desktop) atau tab (mobile)

### 5. Profil User (`/profile/[userId]`)
- Avatar, nama, bio, tanggal bergabung
- Statistik: total post, komentar, reputasi, jawaban diterima
- Tab: Posts | Komentar | Bookmarks (bookmarks private)
- Edit profil untuk pemilik

### 6. Sistem Reputasi
- Post di-upvote: +10
- Post di-downvote: -2
- Komentar di-upvote: +5
- Komentar di-downvote: -1
- Jawaban diterima: +25
- Melakukan downvote: -1 (dari voter sendiri)

Badge reputasi di sebelah nama user:
- Abu-abu: 0–99
- Hijau: 100–499
- Biru: 500–999
- Ungu: 1000–4999
- Emas: 5000+

### 7. Leaderboard (`/leaderboard`)
- Tab: Mingguan | Bulanan | Sepanjang masa
- Ranking berdasarkan reputasi dalam periode
- Top 50 user
- Highlight posisi user yang sedang login

### 8. Search (`/search`)
- Full-text search via SQLite FTS5
- Cakupan: title, content, tags
- Highlight kata kunci di hasil
- Filter: subject, type, date range
- Buat FTS5 virtual table `posts_fts` yang sync via trigger

### 9. Notifikasi
- Bell icon di navbar dengan badge unread count
- Dropdown 10 notifikasi terbaru dengan animasi slide-down
- Klik → redirect + mark as read
- Mark all as read
- Dikirim saat: ada komentar di post kita, reply komentar kita,
  upvote post/komentar (max 1 notif per 24 jam per post),
  jawaban diterima

### 10. Admin Dashboard (`/admin`)
Akses hanya role "admin".
- Dashboard: statistik total users, posts, komentar, grafik 7 hari
- Moderasi Post: list post, pin/unpin, hapus
- Laporan: list reports pending, resolve atau dismiss
- User management: ubah role, suspend, hapus user

---

## YouTube Embed — Implementasi Detail

Install: `npm install react-lite-youtube-embed`

Buat helper `lib/youtube.ts`:
```ts
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null
}
```

Buat komponen `components/youtube-embed.tsx`:
```tsx
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'

export function YouTubeEmbed({ id, title }: { id: string; title?: string }) {
  return (
    <div className="my-4 rounded-xl overflow-hidden">
      <LiteYouTubeEmbed
        id={id}
        title={title ?? 'YouTube video'}
        noCookie={true}
        poster="hqdefault"
      />
    </div>
  )
}
```

Di `components/markdown-renderer.tsx`, gunakan custom components
untuk react-markdown. Deteksi URL YouTube di dalam paragraf:
jika sebuah paragraf hanya berisi satu URL YouTube (standalone),
render sebagai `<YouTubeEmbed>` bukan sebagai link biasa.

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { YouTubeEmbed } from './youtube-embed'
import { extractYouTubeId, isYouTubeUrl } from '@/lib/youtube'

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        p({ children, ...props }) {
          const text = String(children)
          const youtubeId = isYouTubeUrl(text.trim())
            ? extractYouTubeId(text.trim())
            : null
          if (youtubeId) {
            return <YouTubeEmbed id={youtubeId} />
          }
          return <p {...props}>{children}</p>
        },
        a({ href, children, ...props }) {
          if (href && isYouTubeUrl(href)) {
            const id = extractYouTubeId(href)
            if (id) return <YouTubeEmbed id={id} />
          }
          return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
```

---

## UI/UX — Gen Z Design System

### Filosofi Desain
JANGAN buat tampilan "AI slop" — hindari:
- Layout kartu putih polos dengan shadow tipis yang membosankan
- Warna biru korporat flat tanpa karakter
- Animasi fade-in yang lambat dan kaku
- Font Inter biasa tanpa hierarchy yang kuat
- Tombol rounded-full abu-abu yang generik

Yang HARUS diimplementasikan:

### Warna & Tema
Gunakan palette yang berani dan punya karakter. Contoh arah:
- Primary: indigo/violet yang kaya (#6366f1 atau disesuaikan)
- Accent: amber atau emerald untuk highlight interaktif
- Background dark mode: bukan hitam murni, gunakan slate-950
  atau zinc-950 (lebih hangat)
- Background light mode: bukan putih murni, gunakan slate-50
  atau zinc-50
- Subject badges: masing-masing subject punya warna unik yang
  di-generate dari field `color` di database, bukan warna
  generic yang sama

### Tipografi
- Font heading: Geist (sudah built-in Next.js 14) atau Cal Sans
  untuk judul besar — berikan karakter
- Font body: Inter atau Geist Sans, ukuran yang nyaman 15-16px
- Font kode: Geist Mono
- Hierarchy yang jelas: judul post harus berani, bukan tipis

### Animasi (Framer Motion — wajib di semua komponen utama)

Install: `npm install framer-motion`

Implementasikan animasi berikut:

1. **Page transition**: setiap perpindahan halaman ada animasi
   slide + fade menggunakan AnimatePresence di layout.tsx

2. **Post card**: saat masuk viewport, animate dari bawah ke atas
   dengan stagger (kartu pertama muncul duluan, lalu berikutnya).
   Gunakan `whileInView` dengan `viewport={{ once: true }}`

3. **Vote button**: saat di-klik upvote, angka score animate
   naik (counter animation). Tombol panah bounce kecil saat klik.
   Gunakan spring animation bukan easing linear.

4. **Bookmark**: saat di-klik, icon bookmark fill dengan animasi
   scale + warna. Mirip like button Instagram.

5. **Notification bell**: badge unread count animate masuk dengan
   scale bounce. Bell icon shake saat ada notifikasi baru.

6. **Subject badge**: hover effect dengan slight scale + shadow.

7. **Modal/Dialog**: animate masuk dengan scale dari 0.95 ke 1
   + opacity, bukan langsung muncul.

8. **Dropdown notifikasi**: slide down dari atas dengan spring.

9. **Skeleton loader**: gunakan shimmer animation (bukan opacity
   pulse biasa). Implementasi dengan CSS gradient animation
   yang bergerak dari kiri ke kanan.

10. **Leaderboard**: saat halaman pertama load, item ranking
    animate masuk dari bawah dengan stagger delay per item.

11. **Reputation badge**: saat user mendapat reputasi baru,
    angka animate naik (odometer style) menggunakan
    `animated-counter.tsx`.

12. **Tab switching**: konten tab animate dengan slide horizontal,
    bukan langsung ganti.

Contoh implementasi page transition di `app/(main)/layout.tsx`:
```tsx
'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function MainLayout({ children }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

Contoh vote button dengan spring:
```tsx
<motion.button
  whileTap={{ scale: 0.85 }}
  whileHover={{ scale: 1.1 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
  onClick={handleVote}
>
  <ArrowUp />
</motion.button>
```

### Micro-interactions
- Hover pada post card: slight border color change + subtle
  background shift, BUKAN box-shadow besar yang norak
- Input focus: border animate ke warna primary dengan transition
- Button click: ripple effect atau scale down ringan
- Copy link: icon check muncul setelah copy dengan animasi,
  kembali ke icon copy setelah 2 detik
- Loading state tombol: spinner kecil di dalam tombol,
  bukan disable saja

### Navbar
- Desktop: sticky top dengan backdrop-blur (glassmorphism tipis)
- Scroll ke bawah: navbar mengecil sedikit (height transition)
- Dark mode toggle dengan animasi sun/moon morph (atau slide)
- Search bar: expand animasi saat diklik di mobile

### Post Detail
- Konten markdown punya typografi yang indah:
  - Heading dengan border-left accent color
  - Blockquote dengan background subtle + border-left tebal
  - Code block dengan header bahasa + tombol copy
  - Table yang styled rapi
- Tombol "scroll to top" muncul saat user scroll jauh ke bawah,
  dengan animasi fade + slide dari bawah

### Empty States
Jangan tampilkan halaman kosong polos. Setiap empty state punya:
- Ilustrasi SVG sederhana yang relevan (gambar sendiri dengan SVG,
  bukan import library besar)
- Judul yang friendly ("Belum ada diskusi nih!")
- Deskripsi singkat
- CTA button (misalnya "Mulai diskusi pertama")

### Dark Mode
- Implementasikan dengan `next-themes`
- Pastikan SEMUA komponen terlihat baik di dark mode
- Dark mode default untuk user baru (trendy untuk Gen Z)
- Simpan preferensi di localStorage

---

## Auth (Better Auth)

Setup dengan:
- Provider: Email + Password + Google OAuth
- Session strategy: database sessions di Turso
- Setelah register, insert ke tabel users dengan role "user"
- Middleware: route `(admin)` require role "admin",
  aksi mutasi require login (read boleh publik)

---

## Environment Variables

```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## Seed Data

Buat `lib/db/seed.ts`:
- 1 akun admin: admin@warungilmu.id / admin123
- 10 mata pelajaran: Matematika, Fisika, Kimia, Biologi,
  Bahasa Indonesia, Bahasa Inggris, Sejarah, Geografi,
  Ekonomi, Sosiologi — masing-masing dengan icon emoji
  dan warna unik
- 5 sample posts dengan komentar dan reply untuk testing tampilan
- Salah satu sample post mengandung URL YouTube untuk test embed

---

## Urutan Implementasi

1. Setup project, install semua dependencies
2. Konfigurasi Turso + Drizzle + Better Auth
3. Buat semua schema database + migrasi + FTS5 trigger
4. Seed data
5. Auth (login, register, Google OAuth, middleware)
6. Layout utama: navbar, sidebar, bottom nav mobile,
   dark mode toggle, page transition Framer Motion
7. Home feed + PostCard + skeleton loader + infinite scroll
8. Detail post + MarkdownRenderer + YouTubeEmbed detection
9. Sistem vote dengan optimistic UI + animasi spring
10. Sistem bookmark dengan animasi
11. Sistem komentar + nested reply + accepted answer
12. Buat post baru: editor + preview + YouTube URL preview
13. Profil user
14. Search FTS5
15. Notifikasi: bell + dropdown + badge animation
16. Reputasi + badge + animated counter
17. Leaderboard + stagger animation
18. Admin dashboard
19. Semua empty states + error states
20. Polish animasi keseluruhan, pastikan konsisten
21. Test responsif mobile + dark mode semua halaman

---

## Catatan Penting

- Gunakan server actions untuk semua mutasi data
- Semua query via Drizzle ORM, raw SQL hanya untuk FTS5
- Jangan hardcode environment variable apapun
- Gunakan `cuid2` untuk semua ID entitas
- Setiap server action validasi session sebelum operasi
- YouTube embed: gunakan mode no-cookie (youtube-nocookie.com)
  dan lazy load thumbnail — jangan autoplay
- Animasi Framer Motion: gunakan `reduced-motion` media query
  untuk aksesibilitas — wrap semua animasi dengan check
  `useReducedMotion()` dari Framer Motion
- Semua animasi harus terasa snappy dan responsif, bukan lambat.
  Duration maksimal 300ms untuk micro-interaction,
  200ms untuk transition sederhana
- Implementasikan semua fitur dalam satu branch: `feat/warung-ilmu`
- Catat semua keputusan teknis di `IMPLEMENTATION_LOG.md`
```
