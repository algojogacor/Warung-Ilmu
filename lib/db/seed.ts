import { db } from "./index";
import { users, subjects, posts } from "./schema";
import { eq } from "drizzle-orm";
import { auth } from "../auth";

async function seed() {
  console.log("Seeding database...");

  // Insert 10 Subjects
  const subjectData = [
    { name: "Matematika", slug: "matematika", icon: "📐", color: "#3b82f6", description: "Pembahasan Matematika Dasar hingga Lanjut" },
    { name: "Fisika", slug: "fisika", icon: "⚛️", color: "#8b5cf6", description: "Pembahasan Fisika Mekanika, Termodinamika, dll" },
    { name: "Kimia", slug: "kimia", icon: "🧪", color: "#10b981", description: "Pembahasan Reaksi Kimia, Stoikiometri, dll" },
    { name: "Biologi", slug: "biologi", icon: "🧬", color: "#14b8a6", description: "Pembahasan Anatomi, Genetika, Ekologi, dll" },
    { name: "Bahasa Indonesia", slug: "bahasa-indonesia", icon: "📚", color: "#ef4444", description: "Pembahasan EYD, Sastra, dan Pemahaman Bacaan" },
    { name: "Bahasa Inggris", slug: "bahasa-inggris", icon: "🇬🇧", color: "#f59e0b", description: "Grammar, Reading Comprehension, dan Vocab" },
    { name: "Sejarah", slug: "sejarah", icon: "🏛️", color: "#f97316", description: "Sejarah Indonesia dan Dunia" },
    { name: "Geografi", slug: "geografi", icon: "🌍", color: "#84cc16", description: "Tata Surya, Peta, dan Lingkungan Hidup" },
    { name: "Ekonomi", slug: "ekonomi", icon: "📈", color: "#06b6d4", description: "Makro, Mikro, dan Akuntansi" },
    { name: "Sosiologi", slug: "sosiologi", icon: "🤝", color: "#6366f1", description: "Interaksi Sosial, Budaya, dan Masyarakat" },
  ];

  await db.insert(subjects).values(subjectData).onConflictDoNothing({ target: subjects.slug });

  // Create Admin
  const [adminUser] = await db.select().from(users).where(eq(users.email, "admin@warungilmu.id"));
  let adminId;
  if (!adminUser) {
    const adminPassword = process.env.ADMIN_SEED_PASSWORD
    if (!adminPassword) {
      throw new Error("Missing ADMIN_SEED_PASSWORD environment variable for seeding")
    }

    const reqHeaders = new Headers();
    const newAdmin = await auth.api.signUpEmail({
      body: { email: "admin@warungilmu.id", password: adminPassword, name: "Admin Warung Ilmu" },
      headers: reqHeaders
    });
    if(newAdmin?.user) {
      await db.update(users).set({ role: "admin", emailVerified: true }).where(eq(users.id, newAdmin.user.id));
      adminId = newAdmin.user.id;
    }
  } else {
    adminId = adminUser.id;
  }

  // Find subject Matematika
  const [matematika] = await db.select().from(subjects).where(eq(subjects.slug, "matematika"));

  if(matematika && adminId) {
    await db.insert(posts).values({
      title: "Rumus Cepat Persamaan Kuadrat",
      content: "Halo semua! Ini adalah cara cepat menyelesaikan persamaan kuadrat.\n\n$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$\n\nSemoga bermanfaat!",
      type: "tip",
      subjectId: matematika.id,
      authorId: adminId,
    });
  }

  console.log("Seeding completed!");
}

seed().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});
