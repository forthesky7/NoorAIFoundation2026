import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, videosTable, progressTable, subscriptionsTable } from "@workspace/db/schema";
import { eq, count, like, or, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../lib/auth";

const router = Router();

// Category sort order for "smart" recent videos
const CAT_ORDER: Record<string, number> = { Qudurat: 0, Tahsili: 1, Secondary: 2, General: 3 };

function extractPrefix(title: string) {
  const m = title.match(/^(\d{1,2})\./);
  return m ? parseInt(m[1], 10) : 999;
}

function extractSubType(title: string, prefix: number): number {
  if (prefix === 2) {
    if (/لفظي/.test(title)) return 0;
    if (/تدريب/.test(title)) return 1;
    if (/نماذج/.test(title)) return 2;
    if (/قطع/.test(title)) return 3;
    return 4;
  }
  if (prefix === 1) {
    if (/كمي/.test(title)) return 0;
    if (/لفظي/.test(title)) return 1;
    return 2;
  }
  return 0;
}

function extractEpisode(title: string): number {
  const arM = title.match(/حلقة\s*(\d+)/);
  if (arM) return parseInt(arM[1], 10);
  const enM = title.match(/episode\s*(\d+)/i);
  if (enM) return parseInt(enM[1], 10);
  if (/مقدمة/.test(title)) return 0;
  return 999;
}

function sortVideosBySequence(videos: any[]) {
  return [...videos].sort((a, b) => {
    const catA = CAT_ORDER[a.subject] ?? 9;
    const catB = CAT_ORDER[b.subject] ?? 9;
    if (catA !== catB) return catA - catB;
    const preA = extractPrefix(a.title);
    const preB = extractPrefix(b.title);
    if (preA !== preB) return preA - preB;
    const stA = extractSubType(a.title, preA);
    const stB = extractSubType(b.title, preB);
    if (stA !== stB) return stA - stB;
    return extractEpisode(a.title) - extractEpisode(b.title);
  });
}

router.get("/dashboard/summary", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    const user = users[0];

    const allVideos = await db.select().from(videosTable).limit(200);
    const [{ total }] = await db.select({ total: count() }).from(videosTable);

    const userProgress = await db.select().from(progressTable).where(eq(progressTable.userId, req.userId!));
    const completedVideos = userProgress.filter(p => p.completed).length;
    const totalMinutesLearned = Math.floor(userProgress.reduce((acc, p) => acc + p.watchedSeconds, 0) / 60);

    // Session-isolated: show user's recently-watched videos if they have progress;
    // for new students show the first 6 by canonical sequence (دورات القدرات ep1, ep2...)
    let recentVideos: any[];
    if (userProgress.length > 0) {
      // Sort by most recently updated progress
      const sortedProgress = [...userProgress].sort((a, b) => {
        const ta = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
        const tb = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
        return tb - ta;
      });
      const recentVideoIds = sortedProgress.slice(0, 6).map(p => p.videoId);
      recentVideos = recentVideoIds
        .map(id => allVideos.find(v => v.id === id))
        .filter(Boolean);
    } else {
      // New student — show first 6 in canonical sequence
      recentVideos = sortVideosBySequence(allVideos).slice(0, 6);
    }

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, subscribed: user.subscribed, createdAt: user.createdAt.toISOString() },
      totalVideos: Number(total),
      completedVideos,
      minutesLearned: totalMinutesLearned,
      streakDays: Math.max(1, userProgress.length > 0 ? Math.min(userProgress.length * 2, 30) : 0),
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

router.get("/dashboard/admin", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
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
    let allUsers;
    if (search.trim()) {
      allUsers = await db.select().from(usersTable).where(
        or(like(usersTable.name, `%${search}%`), like(usersTable.email, `%${search}%`))
      );
    } else {
      allUsers = await db.select().from(usersTable).limit(100);
    }
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
