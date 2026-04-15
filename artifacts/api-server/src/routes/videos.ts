import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, checkpointsTable } from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";
import { CreateVideoBody, ListVideosQueryParams, GetVideoParams, UpdateVideoBody, DeleteVideoParams, CreateCheckpointBody, GetVideoCheckpointsParams, CreateCheckpointParams } from "@workspace/api-zod";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../lib/auth";

const router = Router();

router.get("/videos", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { subject, grade } = req.query as { subject?: string; grade?: string };
    const videos = await db.select().from(videosTable);
    
    const checkpointCounts = await db.select({ videoId: checkpointsTable.videoId, cnt: count() }).from(checkpointsTable).groupBy(checkpointsTable.videoId);
    const countMap = new Map(checkpointCounts.map(c => [c.videoId, Number(c.cnt)]));
    
    let filtered = videos;
    if (subject) filtered = filtered.filter(v => v.subject.toLowerCase() === subject.toLowerCase());
    if (grade) filtered = filtered.filter(v => v.grade.toLowerCase() === grade.toLowerCase());
    
    return res.json(filtered.map(v => ({
      id: v.id,
      title: v.title,
      description: v.description,
      youtubeId: v.youtubeId,
      subject: v.subject,
      grade: v.grade,
      duration: v.duration,
      thumbnailUrl: v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
      checkpointCount: countMap.get(v.id) || 0,
      createdAt: v.createdAt.toISOString(),
    })));
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

function extractYouTubeId(input: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return input;
}

router.post("/videos", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const parsed = CreateVideoBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const { title, description, subject, grade, duration, thumbnailUrl } = parsed.data;
    const youtubeId = extractYouTubeId(parsed.data.youtubeId);
    const [video] = await db.insert(videosTable).values({
      title, description: description || "", youtubeId, subject, grade, duration,
      thumbnailUrl: thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    }).returning();
    return res.status(201).json({ ...video, checkpointCount: 0, createdAt: video.createdAt.toISOString() });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/videos/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const videos = await db.select().from(videosTable).where(eq(videosTable.id, id));
    if (videos.length === 0) return res.status(404).json({ error: "Video not found" });
    const video = videos[0];
    const [{ cnt }] = await db.select({ cnt: count() }).from(checkpointsTable).where(eq(checkpointsTable.videoId, id));
    return res.json({ ...video, checkpointCount: Number(cnt), thumbnailUrl: video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`, createdAt: video.createdAt.toISOString() });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/videos/:id", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = UpdateVideoBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const { title, description, youtubeId, subject, grade, duration, thumbnailUrl } = parsed.data;
    const [video] = await db.update(videosTable).set({ title, description: description || "", youtubeId, subject, grade, duration, thumbnailUrl }).where(eq(videosTable.id, id)).returning();
    if (!video) return res.status(404).json({ error: "Video not found" });
    const [{ cnt }] = await db.select({ cnt: count() }).from(checkpointsTable).where(eq(checkpointsTable.videoId, id));
    return res.json({ ...video, checkpointCount: Number(cnt), createdAt: video.createdAt.toISOString() });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/videos/:id", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(videosTable).where(eq(videosTable.id, id));
    return res.json({ message: "Video deleted" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/videos/:id/checkpoints", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const checkpoints = await db.select().from(checkpointsTable).where(eq(checkpointsTable.videoId, videoId));
    return res.json(checkpoints.map(c => ({ id: c.id, videoId: c.videoId, timestampSeconds: c.timestampSeconds, question: c.question, context: c.context })));
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/videos/:id/checkpoints", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const parsed = CreateCheckpointBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const [checkpoint] = await db.insert(checkpointsTable).values({ videoId, timestampSeconds: parsed.data.timestampSeconds, question: parsed.data.question, context: parsed.data.context || "" }).returning();
    return res.status(201).json({ id: checkpoint.id, videoId: checkpoint.videoId, timestampSeconds: checkpoint.timestampSeconds, question: checkpoint.question, context: checkpoint.context });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
