import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../lib/auth";

const router = Router();

function generateCode(userId: number): string {
  const base = "NOOR";
  const suffix = (userId * 7 + 1337).toString(36).toUpperCase().slice(0, 4);
  return `${base}${suffix}`;
}

router.get("/coupons/my-code", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const code = generateCode(userId);
    return res.json({ code, discountPercent: 20, message: "شارك هذا الكود مع أصدقائك ليحصلوا على 20% خصم" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/coupons/validate", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body as { code?: string };
    if (!code || typeof code !== "string") return res.status(400).json({ error: "كود غير صالح" });

    const normalised = code.trim().toUpperCase();
    if (!normalised.startsWith("NOOR") || normalised.length < 6) {
      return res.status(400).json({ valid: false, error: "الكود غير موجود أو منتهي الصلاحية" });
    }

    const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
    const found = allUsers.find(u => generateCode(u.id) === normalised);
    if (!found) {
      return res.status(400).json({ valid: false, error: "الكود غير موجود أو منتهي الصلاحية" });
    }
    if (found.id === req.userId) {
      return res.status(400).json({ valid: false, error: "لا يمكنك استخدام كودك الخاص" });
    }

    return res.json({ valid: true, discountPercent: 20, message: "كود صالح! ستحصل على خصم 20%" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
