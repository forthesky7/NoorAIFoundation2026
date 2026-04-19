import { db } from "@workspace/db";
import { usersTable, videosTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const OWNER_EMAIL = "forthesky7@gmail.com";
const ADMIN_EMAIL = "admin@noorai.com";
const STUDENT1_EMAIL = "ahmed@student.com";
const STUDENT2_EMAIL = "sara@student.com";
const DEFAULT_PASSWORD = "password";

const TEST_VIDEOS = [
  {
    title: "Rick Astley - Never Gonna Give You Up",
    description: "فيديو اختباري للمنصة",
    youtubeId: "dQw4w9WgXcQ",
    subject: "General",
    grade: "General",
    duration: 213,
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  },
  {
    title: "فيديو اختباري 2",
    description: "فيديو اختباري للمنصة رقم 2",
    youtubeId: "AkNxcHfBsns",
    subject: "General",
    grade: "General",
    duration: 300,
    thumbnailUrl: "https://img.youtube.com/vi/AkNxcHfBsns/hqdefault.jpg",
  },
];

export async function seedDatabase() {
  try {
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const seedUsers = [
      { name: "Sky (Owner)", email: OWNER_EMAIL, role: "admin" as const },
      { name: "Admin Noor", email: ADMIN_EMAIL, role: "admin" as const },
      { name: "Ahmed Student", email: STUDENT1_EMAIL, role: "student" as const },
      { name: "Sara Student", email: STUDENT2_EMAIL, role: "student" as const },
    ];

    for (const u of seedUsers) {
      const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, u.email));
      if (existing.length === 0) {
        await db.insert(usersTable).values({
          name: u.name,
          email: u.email,
          passwordHash: hash,
          role: u.role,
          subscribed: false,
        });
        console.log(`[seed] Created user: ${u.email}`);
      } else if (u.email === OWNER_EMAIL) {
        await db.update(usersTable)
          .set({ role: "admin" })
          .where(eq(usersTable.email, OWNER_EMAIL));
        console.log(`[seed] Ensured owner admin role: ${u.email}`);
      }
    }

    const existingVideos = await db.select({ id: videosTable.id }).from(videosTable);
    if (existingVideos.length === 0) {
      for (const v of TEST_VIDEOS) {
        await db.insert(videosTable).values(v);
        console.log(`[seed] Created video: ${v.youtubeId}`);
      }
    }

    console.log("[seed] Database seed complete.");
  } catch (err) {
    console.error("[seed] Seed error:", err);
  }
}
