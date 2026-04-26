import { Router } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../lib/auth";

const router = Router();
const REQUESTS_FILE = join(process.cwd(), "data", "student_requests.json");

type LessonRequest = { id: string; text: string; userId: number; email?: string; date: string };

function loadRequests(): LessonRequest[] {
  if (!existsSync(REQUESTS_FILE)) return [];
  try { return JSON.parse(readFileSync(REQUESTS_FILE, "utf-8")); } catch { return []; }
}

function saveRequests(requests: LessonRequest[]) {
  mkdirSync(dirname(REQUESTS_FILE), { recursive: true });
  writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));
}

// Any authenticated user can submit a lesson request
router.post("/requests", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { text, email } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Request text required" });
    const requests = loadRequests();
    const entry: LessonRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: text.trim(),
      userId: req.userId!,
      email: email || "",
      date: new Date().toISOString(),
    };
    requests.unshift(entry);
    saveRequests(requests);
    return res.json({ ok: true, id: entry.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Admin-only: view all requests
router.get("/requests", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    return res.json(loadRequests());
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Admin: delete a request
router.delete("/requests/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const requests = loadRequests().filter(r => r.id !== req.params.id);
    saveRequests(requests);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
