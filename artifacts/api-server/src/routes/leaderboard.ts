import { Router } from "express";
import { db } from "@workspace/db";
import { progressTable, usersTable } from "@workspace/db/schema";
import { eq, count, sum, desc } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../lib/auth";

const router = Router();

router.get("/leaderboard", authMiddleware, async (_req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        userId: progressTable.userId,
        userName: usersTable.name,
        completedCount: count(progressTable.id),
        totalSeconds: sum(progressTable.watchedSeconds),
      })
      .from(progressTable)
      .leftJoin(usersTable, eq(progressTable.userId, usersTable.id))
      .where(eq(progressTable.completed, true))
      .groupBy(progressTable.userId, usersTable.name)
      .orderBy(desc(count(progressTable.id)))
      .limit(20);

    return res.json(
      rows.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        name: r.userName || "طالب",
        completedVideos: Number(r.completedCount),
        totalMinutes: Math.floor(Number(r.totalSeconds || 0) / 60),
      }))
    );
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
