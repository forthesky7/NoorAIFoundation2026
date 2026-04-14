import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "noor-ai-secret-key-2024";

router.post("/auth/register", async (req, res) => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }
    const { name, email, password } = parsed.data;
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ name, email, passwordHash, role: "student" }).returning();
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, subscribed: user.subscribed, createdAt: user.createdAt.toISOString() },
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }
    const { email, password } = parsed.data;
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, subscribed: user.subscribed, createdAt: user.createdAt.toISOString() },
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/logout", (_req, res) => {
  return res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const users = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId));
    if (users.length === 0) return res.status(401).json({ error: "User not found" });
    const user = users[0];
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, subscribed: user.subscribed, createdAt: user.createdAt.toISOString() });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
