import { Router } from "express";
import { db } from "@workspace/db";
import { progressTable, videosTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../lib/auth";
import { RecordProgressBody } from "@workspace/api-zod";

const router = Router();

router.get("/progress", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userProgress = await db
      .select({ progress: progressTable, video: videosTable })
      .from(progressTable)
      .leftJoin(videosTable, eq(progressTable.videoId, videosTable.id))
      .where(eq(progressTable.userId, req.userId!));
    
    const totalVideosWatched = userProgress.length;
    const totalMinutesLearned = Math.floor(userProgress.reduce((acc, p) => acc + p.progress.watchedSeconds, 0) / 60);
    const completedVideos = userProgress.filter(p => p.progress.completed).map(p => p.progress.videoId);
    
    const recentActivity = userProgress
      .sort((a, b) => new Date(b.progress.updatedAt).getTime() - new Date(a.progress.updatedAt).getTime())
      .slice(0, 10)
      .map(p => ({
        videoId: p.progress.videoId,
        videoTitle: p.video?.title || "Unknown",
        watchedSeconds: p.progress.watchedSeconds,
        completed: p.progress.completed,
        updatedAt: p.progress.updatedAt.toISOString(),
      }));
    
    return res.json({ totalVideosWatched, totalMinutesLearned, completedVideos, recentActivity });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/progress", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parsed = RecordProgressBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    
    const { videoId, watchedSeconds, completed } = parsed.data;
    
    const existing = await db.select().from(progressTable)
      .where(and(eq(progressTable.userId, req.userId!), eq(progressTable.videoId, videoId)));
    
    if (existing.length > 0) {
      await db.update(progressTable)
        .set({ watchedSeconds, completed: completed || false, updatedAt: new Date() })
        .where(and(eq(progressTable.userId, req.userId!), eq(progressTable.videoId, videoId)));
    } else {
      await db.insert(progressTable).values({ userId: req.userId!, videoId, watchedSeconds, completed: completed || false });
    }
    
    return res.json({ message: "Progress recorded" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
