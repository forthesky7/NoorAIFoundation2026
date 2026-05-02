import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.post("/influencer/apply", async (req, res) => {
  try {
    const { name, platform, followers, handle, email, message } = req.body as Record<string, any>;
    if (!name || !platform || !followers || !handle || !email) {
      return res.status(400).json({ error: "بيانات غير صالحة" });
    }

    await db.execute(sql`
      INSERT INTO influencer_requests (name, platform, followers, handle, email, message)
      VALUES (${String(name)}, ${String(platform)}, ${Number(followers)}, ${String(handle)}, ${String(email)}, ${String(message || "")})
    `);

    return res.json({ ok: true, message: "تم إرسال طلبك بنجاح! سنتواصل معك خلال 48 ساعة." });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
