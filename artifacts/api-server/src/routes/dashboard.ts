import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, videosTable, progressTable } from "@workspace/db/schema";
import { eq, count, like, or } from "drizzle-orm";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../lib/auth";

const router = Router();

// ─── Sorting helpers (mirrors lib/videoSort.ts on the frontend) ───────────────

function extractEpisode(title: string): number {
  const ar = title.match(/حلقة\s*(\d+)/);
  if (ar) return parseInt(ar[1], 10);
  const en = title.match(/[Ee]pisode\s*(\d+)/);
  if (en) return parseInt(en[1], 10);
  const start = title.match(/^(\d+)\s*[-–.]/);
  if (start) return parseInt(start[1], 10);
  if (/مقدمة/.test(title)) return 0;
  return 9999;
}

function extractPrefix(title: string): number {
  const m = title.match(/^(\d{1,3})\./);
  return m ? parseInt(m[1], 10) : 999;
}

function getGroupIndex(subject: string, title: string): number {
  if (subject === "Qudurat") {
    const isFahad  = /فهد|التميمي/.test(title);
    const isEhab   = /إيهاب|عبد.*العظيم|عبدالعظيم/.test(title);
    const isDawrat = /دورات.*قدرات|دورات القدرات/.test(title);
    if (isFahad) {
      if (/استراتيجيات/.test(title)) return 1;
      return 0;
    }
    if (isDawrat) return 2;
    if (isEhab) {
      if (/لفظي/.test(title))  return 3;
      if (/تدريب/.test(title)) return 4;
      if (/نماذج/.test(title)) return 5;
      if (/قطع/.test(title))   return 6;
      return 3;
    }
    return 90 + extractPrefix(title);
  }
  if (subject === "Tahsili") {
    if (/رياضيات/.test(title)) return 0;
    if (/فيزياء/.test(title))  return 1;
    if (/أحياء/.test(title))   return 2;
    if (/كيمياء/.test(title))  return 3;
    return 90 + extractPrefix(title);
  }
  if (subject === "Secondary") {
    const prefix = extractPrefix(title);
    let src = /واضح/.test(title) ? 0 : /مدرسة|school/i.test(title) ? 1 : 9;
    return prefix * 1000 + src * 10;
  }
  return 0;
}

const CAT_ORDER: Record<string, number> = {
  Qudurat: 0, Tahsili: 1, Secondary: 2, General: 3,
};

function sortVideosBySequence<T extends { subject: string; title: string }>(videos: T[]): T[] {
  const indexed = videos.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => {
    const catA = CAT_ORDER[a.v.subject] ?? 9;
    const catB = CAT_ORDER[b.v.subject] ?? 9;
    if (catA !== catB) return catA - catB;
    const grpA = getGroupIndex(a.v.subject, a.v.title);
    const grpB = getGroupIndex(b.v.subject, b.v.title);
    if (grpA !== grpB) return grpA - grpB;
    const epA = extractEpisode(a.v.title);
    const epB = extractEpisode(b.v.title);
    if (epA !== epB) return epA - epB;
    return a.i - b.i;
  });
  return indexed.map(x => x.v);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/dashboard/summary", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    const user = users[0];

    const allVideos = await db.select().from(videosTable).limit(500);
    const [{ total }] = await db.select({ total: count() }).from(videosTable);

    const userProgress = await db.select().from(progressTable).where(eq(progressTable.userId, req.userId!));
    const completedVideos = userProgress.filter(p => p.completed).length;
    const totalMinutesLearned = Math.floor(userProgress.reduce((acc, p) => acc + p.watchedSeconds, 0) / 60);

    // Session-isolated recent videos:
    // • Returning students → most recently watched (their own, not admin's)
    // • New students      → first 6 in canonical sequence (دورات القدرات ep1, ep2…)
    let recentVideos: typeof allVideos;
    if (userProgress.length > 0) {
      const sorted = [...userProgress].sort((a, b) => {
        const ta = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
        const tb = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
        return tb - ta;
      });
      const ids = sorted.slice(0, 6).map(p => p.videoId);
      recentVideos = ids.map(id => allVideos.find(v => v.id === id)).filter(Boolean) as typeof allVideos;
    } else {
      // New student — show first 6 by canonical sort
      recentVideos = sortVideosBySequence(allVideos).slice(0, 6);
    }

    return res.json({
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, subscribed: user.subscribed,
        createdAt: user.createdAt.toISOString(),
      },
      totalVideos: Number(total),
      completedVideos,
      minutesLearned: totalMinutesLearned,
      streakDays: userProgress.length > 0 ? Math.min(userProgress.length * 2, 30) : 0,
      recentVideos: recentVideos.map(v => ({
        ...v,
        checkpointCount: 0,
        thumbnailUrl: v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
        createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
      })),
      subscribed: user.subscribed,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/dashboard/admin", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(usersTable);
    const [{ totalVideos }] = await db.select({ totalVideos: count() }).from(videosTable);
    const [{ totalSubscribers }] = await db.select({ totalSubscribers: count() }).from(usersTable).where(eq(usersTable.subscribed, true));
    const recentUsers = await db.select().from(usersTable).limit(5);
    return res.json({
      totalUsers: Number(totalUsers),
      totalVideos: Number(totalVideos),
      totalSubscribers: Number(totalSubscribers),
      recentUsers: recentUsers.map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        subscribed: u.subscribed, createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/users", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const search = (req.query.search as string) || "";
    const allUsers = search.trim()
      ? await db.select().from(usersTable).where(
          or(like(usersTable.name, `%${search}%`), like(usersTable.email, `%${search}%`))
        )
      : await db.select().from(usersTable).limit(100);
    return res.json(allUsers.map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      subscribed: u.subscribed, createdAt: u.createdAt.toISOString(),
    })));
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/admin/users/:id/activate", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    await db.update(usersTable).set({ subscribed: true, subscriptionExpiresAt: expiresAt }).where(eq(usersTable.id, userId));
    return res.json({ success: true, message: "تم تفعيل الاشتراك بنجاح" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
