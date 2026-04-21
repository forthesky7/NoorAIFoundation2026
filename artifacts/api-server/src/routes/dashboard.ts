import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, videosTable, progressTable, subscriptionsTable } from "@workspace/db/schema";
import { eq, count, like, or } from "drizzle-orm";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../lib/auth";

const router = Router();

router.get("/dashboard/summary", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    const user = users[0];

    const allVideos = await db.select().from(videosTable).limit(50);
    const [{ total }] = await db.select({ total: count() }).from(videosTable);

    const userProgress = await db.select().from(progressTable).where(eq(progressTable.userId, req.userId!));
    const completedVideos = userProgress.filter(p => p.completed).length;
    const totalMinutesLearned = Math.floor(userProgress.reduce((acc, p) => acc + p.watchedSeconds, 0) / 60);

    const recentVideos = allVideos.slice(0, 6);

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, subscribed: user.subscribed, createdAt: user.createdAt.toISOString() },
      totalVideos: Number(total),
      completedVideos,
      minutesLearned: totalMinutesLearned,
      streakDays: Math.floor(Math.random() * 14) + 1,
      recentVideos: recentVideos.map(v => ({
        ...v,
        checkpointCount: 0,
        thumbnailUrl: v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
        createdAt: v.createdAt.toISOString(),
      })),
      subscribed: user.subscribed,
    });
  } catch {
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
        or(
          like(usersTable.name, `%${search}%`),
          like(usersTable.email, `%${search}%`)
        )
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

    await db.update(usersTable)
      .set({ subscribed: true, subscriptionExpiresAt: expiresAt })
      .where(eq(usersTable.id, userId));

    return res.json({ success: true, message: "تم تفعيل الاشتراك بنجاح" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
