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
- Math rendering: KaTeX (remark-math + rehype-katex)
- Email: Resend (3.000 email/bulan gratis)
- PWA: next-pwa
- Drag & drop: @dnd-kit/core (folder bookmark)
- Email template: @react-email/components

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

### 5. KaTeX — Matematika & Rumus (`/posts/[id]` + editor)
Install: `npm install remark-math rehype-katex katex`
Tambahkan plugin ke MarkdownRenderer:
```tsx
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
// tambahkan remarkMath ke remarkPlugins
// tambahkan rehypeKatex ke rehypePlugins
```
User bisa tulis rumus inline `$x^2 + y^2 = r^2$` dan block:
```
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```
Di markdown editor, tambahkan tombol toolbar "∑" untuk insert
template rumus. Preview real-time juga render KaTeX.
Ini WAJIB untuk forum akademik — tanpa ini Matematika dan
Fisika tidak bisa ditulis dengan benar.

### 6. Folder Bookmark (`/bookmarks`)
Tambahkan tabel `bookmark_folders`:
- id (text, PK, cuid2)
- userId (text, FK -> users)
- name (text)
- createdAt (timestamp)

Tambahkan kolom `folderId` (text, nullable FK -> bookmark_folders)
di tabel `bookmarks`.

Halaman `/bookmarks`:
- Sidebar kiri: daftar folder + tombol buat folder baru
- Klik folder → tampilkan bookmark dalam folder itu
- Drag-and-drop bookmark antar folder (gunakan
  `@dnd-kit/core` — gratis, ringan)
- Folder default "Semua Bookmark" tidak bisa dihapus
- Rename dan hapus folder (bookmark di dalamnya pindah ke
  "Semua Bookmark" jika folder dihapus)

### 7. Draft Post
Tambahkan kolom `isDraft` (boolean, default: false) di tabel `posts`.

Logika:
- Halaman `/posts/new` punya dua tombol: "Simpan Draft" dan
  "Publikasikan"
- Draft tidak muncul di feed publik maupun search
- Draft hanya terlihat di tab "Drafts" di profil pemilik
- Auto-save draft setiap 30 detik saat user sedang mengetik
  (gunakan debounce + server action)
- Saat publikasi, set `isDraft = false` dan `createdAt = now()`
- Tampilkan indikator "Auto-saved" di editor saat draft tersimpan

### 8. Mention @Username di Komentar
Implementasi:
- Saat user mengetik `@` di textarea komentar, muncul dropdown
  autocomplete username (query ke DB, filter by prefix)
- Pilih user dari dropdown → insert `@username` ke konten
- Saat komentar disimpan, parse semua `@username` di konten
- Untuk setiap mention valid, kirim notifikasi ke user terkait
  dengan type "mention"
- Di MarkdownRenderer, render `@username` sebagai link ke profil
  dengan warna accent

Tambahkan type "mention" ke enum notifications.type.

Keamanan: validasi bahwa username yang di-mention benar-benar
ada di DB sebelum kirim notifikasi. Batasi max 5 mention per
komentar untuk mencegah spam.

### 9. Posting Anonim
Tambahkan kolom `isAnonymous` (boolean, default: false) di
tabel `posts`.

Logika:
- Di form buat post, ada toggle "Post sebagai Anonim"
- Jika `isAnonymous = true`, tampilkan nama "Anonim" dengan
  avatar generik (SVG default) — authorId tetap tersimpan
  di DB untuk keperluan moderasi admin
- Admin bisa lihat siapa sebenarnya di balik post anonim
- User tidak bisa posting anonim lebih dari 3 kali per hari
  (anti-abuse rate limit)
- Post anonim tidak menambah reputasi author

### 10. Post & Komentar Edit History
Tambahkan kolom `editedAt` (timestamp, nullable) di tabel
`posts` dan `comments`.

Tambahkan tabel `edit_history`:
- id (text, PK)
- postId (text, nullable FK -> posts)
- commentId (text, nullable FK -> comments)
- previousContent (text)
- editedAt (timestamp)

Logika:
- Saat post/komentar diedit, simpan konten lama ke edit_history
- Tampilkan label "diedit X menit lalu" di bawah konten
- Klik label → modal popup tampilkan history perubahan
- Batasi edit: post hanya bisa diedit dalam 24 jam setelah dibuat.
  Komentar bisa diedit dalam 15 menit.

### 11. Paste Gambar dari Clipboard
Di markdown editor, tambahkan event listener `paste`:
```ts
editor.addEventListener('paste', async (e) => {
  const items = Array.from(e.clipboardData?.items ?? [])
  const imageItem = items.find(item => item.type.startsWith('image/'))
  if (!imageItem) return
  e.preventDefault()
  const file = imageItem.getAsFile()
  if (!file) return
  // Upload ke Cloudinary via server action
  const url = await uploadImageAction(file)
  // Insert markdown image ke posisi cursor
  insertAtCursor(`![gambar](${url})`)
})
```
Tampilkan progress upload inline di editor (loading state kecil
di samping toolbar). Batasi ukuran gambar paste max 5MB.

### 12. Share ke WhatsApp
Di setiap post, tombol share punya dropdown:
- Copy Link (existing)
- Share ke WhatsApp → buka `https://wa.me/?text=` dengan
  format: `*[Judul Post]* - Warung Ilmu\n\n[URL post]`
- Share ke Twitter/X → `https://twitter.com/intent/tweet`

Ini growth engine organik terbesar untuk pengguna Indonesia.

### 13. Weekly Digest Email via Resend
Install: `npm install resend` (free tier: 3.000 email/bulan)

Tambahkan tabel `email_preferences`:
- userId (text, FK -> users)
- weeklyDigest (boolean, default: true)
- updatedAt (timestamp)

Buat Vercel Cron Job (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/weekly-digest",
    "schedule": "0 7 * * 1"
  }]
}
```
Setiap Senin pagi, kirim email berisi top 5 post minggu lalu
per subject yang diminati user. Template email dibuat dengan
React Email (`npm install @react-email/components`).

Tambahkan env: `RESEND_API_KEY=`

### 14. Profil User (`/profile/[userId]`)
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

## Keamanan — Wajib Diimplementasikan Semua

### 1. Input Sanitization & Validasi
Gunakan `zod` untuk validasi semua input di server action
sebelum diproses:
```ts
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(10).max(200).trim(),
  content: z.string().min(30).max(50000).trim(),
  type: z.enum(['discussion', 'question', 'tip', 'summary']),
  subjectId: z.string().cuid2(),
  tags: z.array(z.string().max(30)).max(5),
  isDraft: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
})
```
Terapkan schema zod di SEMUA server action — post, komentar,
profil, bookmark, dll. Jangan pernah trust input user tanpa
validasi.

### 2. Auth Guard di Setiap Server Action
Setiap server action yang butuh login harus selalu validasi
session di baris pertama:
```ts
export async function createPostAction(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  // lanjut proses...
}
```
Jangan andalkan middleware saja — validasi session langsung
di dalam action sebagai defense in depth.

### 3. CSRF Protection
Better Auth sudah handle CSRF untuk session-based auth.
Pastikan semua mutasi dilakukan via POST (server action),
bukan GET. Jangan expose operasi mutasi via GET parameter.

### 4. Rate Limiting per Route
Implementasikan rate limiting di level middleware Next.js
menggunakan `upstash/ratelimit` (free tier) atau implementasi
sederhana berbasis Turso:

Buat tabel `rate_limits`:
- key (text, PK) — format: "action:userId" atau "action:ip"
- count (integer)
- resetAt (timestamp)

Rate limit per aksi:
- Buat post: 10 post/jam per user
- Buat komentar: 30 komentar/jam per user
- Vote: 100 vote/jam per user
- Register: 5 percobaan/jam per IP
- Login: 10 percobaan/15 menit per IP
- Upload gambar: 20 upload/jam per user
- Post anonim: 3 post anonim/hari per user
- Mention: max 5 mention per komentar
- Edit post: max 10 edit per post

Kembalikan error `429 Too Many Requests` dengan pesan ramah
dan waktu reset ("Coba lagi dalam 5 menit ya 🙏").

### 5. File Upload Security (Gambar)
Di server action upload gambar ke Cloudinary:
- Validasi MIME type: hanya `image/jpeg`, `image/png`,
  `image/gif`, `image/webp` yang diterima
- Validasi ukuran: maksimal 5MB
- Jangan pernah execute atau serve file yang diupload langsung
- Gunakan Cloudinary transformation untuk strip metadata EXIF
  dan resize otomatis (mencegah zip bomb lewat gambar raksasa)
- Generate nama file acak di Cloudinary, jangan gunakan
  nama file asli dari user

```ts
// Di server action upload
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
if (!allowedTypes.includes(file.type)) {
  throw new Error('Tipe file tidak didukung')
}
if (file.size > 5 * 1024 * 1024) {
  throw new Error('Ukuran file maksimal 5MB')
}
```

### 6. XSS Prevention
- React sudah escape HTML secara default — jangan gunakan
  `dangerouslySetInnerHTML` kecuali untuk output
  `react-markdown` yang sudah disanitasi
- Tambahkan `rehype-sanitize` ke pipeline markdown renderer
  untuk strip tag HTML berbahaya dari konten user:
  ```ts
  import rehypeSanitize from 'rehype-sanitize'
  // tambahkan ke rehypePlugins sebelum rehype-highlight
  ```
- Content Security Policy header: sudah dihandle Vercel,
  tapi tambahkan header via `next.config.js`:
  ```js
  headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }]
  ```

### 7. SQL Injection Prevention
Drizzle ORM menggunakan parameterized queries secara default —
tidak ada raw SQL kecuali FTS5. Untuk query FTS5, gunakan
parameter binding, JANGAN string concatenation:
```ts
// BENAR
db.run(sql`SELECT * FROM posts_fts WHERE posts_fts MATCH ${query}`)
// SALAH — jangan pernah lakukan ini
db.run(`SELECT * FROM posts_fts WHERE posts_fts MATCH '${query}'`)
```

### 8. Sensitive Data Protection
- Jangan pernah return `passwordHash` atau field sensitif di
  response API
- `authorId` post anonim tidak boleh ter-expose di client —
  gunakan select eksplisit di Drizzle, jangan `select *`
- Session token hanya di cookie HttpOnly, tidak di localStorage
- Environment variable tidak boleh ter-expose ke client
  (hanya variabel dengan prefix `NEXT_PUBLIC_` yang boleh
  ada di browser)

### 9. Audit Log untuk Admin
Tambahkan tabel `audit_logs`:
- id (text, PK)
- adminId (text, FK -> users)
- action (text) — "ban_user" | "delete_post" | "resolve_report" | dll
- targetId (text) — ID entitas yang dimodifikasi
- targetType (text) — "user" | "post" | "comment"
- metadata (text) — JSON string detail tambahan
- createdAt (timestamp)

Setiap aksi admin (hapus post, ban user, resolve report) wajib
dicatat ke tabel ini. Tampilkan di halaman admin `/admin/logs`.

### 10. Dependency Security
- Jalankan `npm audit` sebelum deploy
- Tambahkan ke `package.json` script: `"audit": "npm audit --audit-level=high"`
- Gunakan dependabot atau Vercel's built-in security alerts
- Pin semua dependency ke versi exact di `package.json`
  (hindari `^` atau `~` untuk dependency kritis)

---

### FTS5 Trigger (wajib di migrasi Drizzle)
Buat trigger SQL ini di file migrasi Drizzle agar `posts_fts`
selalu sinkron dengan tabel `posts`:

```sql
CREATE VIRTUAL TABLE posts_fts USING fts5(id, title, content);

CREATE TRIGGER posts_ai AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(id, title, content)
  VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER posts_au AFTER UPDATE ON posts BEGIN
  UPDATE posts_fts SET title = new.title, content = new.content
  WHERE id = old.id;
END;

CREATE TRIGGER posts_ad AFTER DELETE ON posts BEGIN
  DELETE FROM posts_fts WHERE id = old.id;
END;
```

### Optimistic UI pada Vote
Gunakan `useOptimistic` dari React 18 untuk vote. Angka score
harus berubah SEBELUM server action selesai — jangan tunggu
response server. Contoh pola:

```tsx
const [optimisticScore, addOptimisticVote] = useOptimistic(
  voteScore,
  (current, delta: number) => current + delta
)

async function handleVote(value: 1 | -1) {
  addOptimisticVote(value)
  await voteAction(postId, value)
}
```

Terapkan pola yang sama untuk bookmark (optimistic toggle state).

### Shadow Banning
Tambahkan kolom `isShadowBanned` (boolean, default: false)
di tabel `users`. Logika:
- User yang di-shadow ban tetap bisa login dan post seperti biasa
- Di semua query fetch posts/comments, tambahkan filter:
  `WHERE author.isShadowBanned = false OR author.id = currentUserId`
- Dengan begitu hanya user tersebut yang melihat kontennya sendiri
- Admin bisa toggle shadow ban di halaman user management
- Ini lebih efektif dari blokir total karena spammer tidak sadar
  mereka sudah dibanned dan tidak langsung buat akun baru

### AI Content Moderation — Multi-Provider Rotation (100% Gratis)

Gunakan rotasi 3 provider gratis dengan fallback otomatis.
Semua provider kompatibel dengan OpenAI SDK sehingga kode
bisa digunakan ulang hanya dengan ganti `baseURL` dan `apiKey`.

**Provider dan limitnya (hasil riset April 2026):**
- **Groq**: gratis permanen, 30 RPM, 14.400 RPD untuk Llama 3.1 8B
- **Cohere**: gratis permanen, 20 RPM, 1.000 request/bulan
- **GitHub Models**: gratis permanen, 10–15 RPM, 50–150 RPD

Strategi: Groq sebagai primary (paling cepat dan limit tertinggi),
Cohere sebagai secondary, GitHub Models sebagai last resort.
Jika semua gagal, fallback ke `isSafe: true` agar user tidak
diblokir karena masalah eksternal.

Tambahkan ke `.env`:
```env
GROQ_API_KEY_1=
GROQ_API_KEY_2=
GROQ_API_KEY_3=
GROQ_API_KEY_4=
GROQ_API_KEY_5=
GROQ_API_KEY_6=
GROQ_API_KEY_7=
GROQ_API_KEY_8=
GROQ_API_KEY_9=
GROQ_API_KEY_10=
COHERE_API_KEY=
GITHUB_MODELS_TOKEN=
```

Buat `lib/ai-moderation.ts`:
```ts
interface ModerationResult {
  isSafe: boolean
  reason?: string
}

const PROMPT = (content: string) =>
  `Apakah teks berikut mengandung kata kasar, ujaran kebencian, SARA, atau konten tidak pantas untuk platform edukasi pelajar SMA Indonesia? Jawab HANYA dengan JSON tanpa penjelasan lain: {"isSafe": true, "reason": ""} atau {"isSafe": false, "reason": "alasan singkat"}.\n\nTeks: ${content.slice(0, 800)}`

function getGroqKeys(): string[] {
  return Array.from({ length: 10 }, (_, i) =>
    process.env[`GROQ_API_KEY_${i + 1}`]
  ).filter(Boolean) as string[]
}

async function callOpenAICompatible(
  baseURL: string,
  apiKey: string,
  model: string,
  content: string
): Promise<string | null> {
  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: PROMPT(content) }],
        max_tokens: 100,
      }),
      signal: AbortSignal.timeout(5000), // 5 detik timeout
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  }
}

export async function checkContentModeration(
  content: string
): Promise<ModerationResult> {
  // 1. Coba semua Groq keys (fastest, highest limits)
  for (const key of getGroqKeys()) {
    const result = await callOpenAICompatible(
      'https://api.groq.com/openai/v1',
      key,
      'llama-3.1-8b-instant',
      content
    )
    if (result) {
      try { return JSON.parse(result.trim()) } catch {}
    }
  }

  // 2. Fallback ke Cohere (20 RPM, 1K/bulan)
  if (process.env.COHERE_API_KEY) {
    const result = await callOpenAICompatible(
      'https://api.cohere.com/compatibility/v1',
      process.env.COHERE_API_KEY,
      'command-r',
      content
    )
    if (result) {
      try { return JSON.parse(result.trim()) } catch {}
    }
  }

  // 3. Fallback ke GitHub Models (10-15 RPM, 50-150 RPD)
  if (process.env.GITHUB_MODELS_TOKEN) {
    const result = await callOpenAICompatible(
      'https://models.github.ai/inference',
      process.env.GITHUB_MODELS_TOKEN,
      'meta/Llama-3.1-8B-Instruct',
      content
    )
    if (result) {
      try { return JSON.parse(result.trim()) } catch {}
    }
  }

  // 4. Semua provider gagal — jangan blokir user
  return { isSafe: true }
}
```

Panggil di server action `post.ts` sebelum insert ke DB.
Jika `isSafe = false`, return error dengan pesan:
"Konten kamu mengandung hal yang tidak sesuai komunitas.
Coba periksa kembali ya! 🙏"

**Cara dapat token gratis:**
- Groq: daftar di console.groq.com (bisa buat hingga 10 akun)
- Cohere: daftar di dashboard.cohere.com → Generate Trial Key
- GitHub Models: GitHub Settings → Developer Settings →
  Personal Access Token → beri permission "Models: Read-only"

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
    /youtube\.com\/shorts\/([^?]+)/,   // YouTube Shorts
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

### Reading Time
Di `PostCard`, hitung dan tampilkan estimasi waktu baca.
Rumus standar: `Math.ceil(wordCount / 200)` menit.
Tampilkan sebagai "3 mnt baca" di sebelah timestamp.
Sangat berguna untuk post tipe "summary" dan "tip".

### Mobile Bottom Navigation
Bottom nav untuk mobile wajib ada animasi spring Framer Motion
saat berpindah tab. Item: Home, Search, Notifications, Profile.
Gunakan indikator aktif berupa pill yang bergerak smooth
menggunakan `layoutId` Framer Motion (shared layout animation):

```tsx
{activeTab === item.id && (
  <motion.div
    layoutId="bottom-nav-indicator"
    className="absolute inset-0 bg-primary/10 rounded-xl"
    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
  />
)}
```

### Open Graph Images
Gunakan `@vercel/og` untuk generate OG image dinamis.
Buat `app/posts/[id]/opengraph-image.tsx`:
- Tampilkan judul post (max 2 baris, font besar)
- Avatar + nama author
- Subject badge dengan warna
- Logo/nama "Warung Ilmu"
- Background gradient sesuai subject color

Saat link post dibagikan ke WhatsApp atau Instagram Story,
gambar preview otomatis ter-generate dengan konten post.

---

## Gamifikasi & Streak

Tambahkan tabel `streaks` di database:
- id (text, PK)
- userId (text, FK -> users)
- currentStreak (integer, default: 0)
- longestStreak (integer, default: 0)
- lastActivityDate (text) — format YYYY-MM-DD
- updatedAt (timestamp)

Logika streak:
- Setiap kali user membuat post atau komentar, cek apakah
  `lastActivityDate` adalah kemarin → increment `currentStreak`
- Jika lebih dari 1 hari absen → reset `currentStreak` ke 1
- Update `longestStreak` jika currentStreak lebih tinggi

Tampilkan di profil user:
- 🔥 icon + angka streak hari ini
- Badge khusus untuk milestone: 7 hari, 30 hari, 100 hari
- Animasi flame yang bergerak saat streak aktif (CSS keyframes)

Tambahkan kolom `currentStreak` dan `longestStreak` sebagai
info tambahan di leaderboard untuk menambah dimensi kompetisi.
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
RESEND_API_KEY=
GROQ_API_KEY_1=
GROQ_API_KEY_2=
GROQ_API_KEY_3=
GROQ_API_KEY_4=
GROQ_API_KEY_5=
GROQ_API_KEY_6=
GROQ_API_KEY_7=
GROQ_API_KEY_8=
GROQ_API_KEY_9=
GROQ_API_KEY_10=
COHERE_API_KEY=
GITHUB_MODELS_TOKEN=
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
8. Detail post + MarkdownRenderer + YouTubeEmbed + KaTeX
9. Sistem vote dengan optimistic UI + animasi spring
10. Sistem bookmark + folder bookmark
11. Sistem komentar + nested reply + accepted answer + mention
12. Buat post baru: editor + preview + YouTube preview + KaTeX
    preview + paste gambar + draft auto-save
13. Post anonim
14. Edit post/komentar + edit history
15. Profil user + streak
16. Search FTS5
17. Notifikasi: bell + dropdown + badge animation
18. Reputasi + badge + animated counter
19. Leaderboard + stagger animation
20. Admin dashboard + audit log
21. PWA manifest + service worker
22. OG images dengan @vercel/og
23. Share WhatsApp + copy link
24. Weekly digest email (Resend + cron)
25. AI moderation (Groq → Cohere → GitHub Models)
26. Rate limiting semua endpoint
27. Semua empty states + error states
28. Polish animasi, dark mode, responsif mobile
29. `npm audit` + security review final

---

## PWA (Progressive Web App)

Install: `npm install next-pwa`

Konfigurasi di `next.config.js`:
```js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})
module.exports = withPWA({ /* next config */ })
```

Buat `public/manifest.json`:
```json
{
  "name": "Warung Ilmu",
  "short_name": "Warung Ilmu",
  "description": "Forum akademik untuk pelajar Indonesia",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Dengan ini, pengguna bisa install Warung Ilmu di homescreen HP
mereka seperti app sungguhan — tanpa perlu App Store.

---

## Catatan Penting

- Gunakan server actions untuk semua mutasi data
- Semua query via Drizzle ORM, raw SQL hanya untuk FTS5
  dengan parameterized binding — jangan string concatenation
- Jangan hardcode environment variable apapun
- Gunakan `cuid2` untuk semua ID entitas
- Setiap server action validasi session + zod schema sebelum operasi
- YouTube embed: gunakan mode no-cookie dan lazy load — jangan autoplay
- Animasi Framer Motion: gunakan `useReducedMotion()` untuk
  aksesibilitas — semua animasi harus bisa dimatikan
- Duration animasi: maksimal 300ms micro-interaction,
  200ms transition sederhana — harus terasa snappy
- File upload: validasi MIME type + ukuran di server, bukan hanya client
- Konten markdown: gunakan `rehype-sanitize` sebelum render
  untuk strip HTML berbahaya
- Post anonim: authorId tetap disimpan di DB, tidak pernah
  dikirim ke client kecuali untuk admin
- Edit history: simpan konten sebelumnya sebelum update
- Rate limiting: implementasikan di semua endpoint mutasi
- Jalankan `npm audit` sebelum setiap deploy
- Implementasikan semua fitur dalam satu branch: `feat/warung-ilmu`
- Catat semua keputusan teknis di `IMPLEMENTATION_LOG.md`
