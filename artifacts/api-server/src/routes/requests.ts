import { Router } from "express";
import { db } from "@workspace/db";
import { studentRequestsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../lib/auth";

const router = Router();

// Any authenticated user can submit a lesson request
router.post("/requests", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { text, email } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Request text required" });

    const [inserted] = await db.insert(studentRequestsTable).values({
      userId: req.userId!,
      email: email?.trim() || "",
      text: text.trim(),
    }).returning();

    return res.json({ ok: true, id: inserted.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Admin-only: view all requests, newest first
router.get("/requests", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const requests = await db.select().from(studentRequestsTable).orderBy(desc(studentRequestsTable.createdAt));
    return res.json(requests.map(r => ({
      id: String(r.id),
      text: r.text,
      userId: r.userId,
      email: r.email,
      date: r.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Admin: delete a request
router.delete("/requests/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!isNaN(id)) {
      await db.delete(studentRequestsTable).where(eq(studentRequestsTable.id, id));
    }
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
