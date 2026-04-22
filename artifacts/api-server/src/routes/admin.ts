import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable } from "@workspace/db/schema";
import { like, or, eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../lib/auth";
import { getSettings, updateSettings } from "../lib/settings";
import { randomUUID } from "crypto";

const router = Router();

function ownerOnly(req: AuthRequest, res: any, next: any) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

router.get("/admin/users", authMiddleware, ownerOnly, async (req: AuthRequest, res) => {
  try {
    const search = (req.query.search as string) || "";
    let users;
    if (search) {
      users = await db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        subscribed: usersTable.subscribed,
        createdAt: usersTable.createdAt,
      }).from(usersTable).where(
        or(
          like(usersTable.name, `%${search}%`),
          like(usersTable.email, `%${search}%`)
        )
      ).limit(50);
    } else {
      users = await db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        subscribed: usersTable.subscribed,
        createdAt: usersTable.createdAt,
      }).from(usersTable).limit(50);
    }
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/admin/users/:id/activate", authMiddleware, ownerOnly, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await db.update(usersTable)
      .set({ subscribed: true, subscriptionExpiresAt: expiresAt })
      .where(eq(usersTable.id, userId));

    const paymentId = `MANUAL_${randomUUID()}`;
    await db.insert(subscriptionsTable).values({
      userId,
      paymentId,
      paymentMethod: "manual",
      currency: "MANUAL",
      amount: "0",
      status: "active",
      expiresAt,
    });

    return res.json({ success: true, message: "Subscription activated", expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/settings", authMiddleware, ownerOnly, async (req: AuthRequest, res) => {
  const settings = getSettings();
  return res.json({
    LEMONSQUEEZY_API_KEY: settings.LEMONSQUEEZY_API_KEY ? "***" + settings.LEMONSQUEEZY_API_KEY.slice(-4) : "",
    LEMONSQUEEZY_STORE_ID: settings.LEMONSQUEEZY_STORE_ID || "",
    LEMONSQUEEZY_VARIANT_ID: settings.LEMONSQUEEZY_VARIANT_ID || "",
    LEMONSQUEEZY_WEBHOOK_SECRET: settings.LEMONSQUEEZY_WEBHOOK_SECRET ? "***" + settings.LEMONSQUEEZY_WEBHOOK_SECRET.slice(-4) : "",
    NOWPAYMENTS_WALLET_TRC20: settings.NOWPAYMENTS_WALLET_TRC20 || "",
    isLemonSqueezyConfigured: !!(settings.LEMONSQUEEZY_API_KEY && settings.LEMONSQUEEZY_STORE_ID && settings.LEMONSQUEEZY_VARIANT_ID),
  });
});

router.post("/admin/settings", authMiddleware, ownerOnly, async (req: AuthRequest, res) => {
  try {
    const allowed = ["LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_STORE_ID", "LEMONSQUEEZY_VARIANT_ID", "LEMONSQUEEZY_WEBHOOK_SECRET", "NOWPAYMENTS_WALLET_TRC20"] as const;
    const updates: Record<string, string> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== "") {
        updates[key] = req.body[key];
      }
    }
    updateSettings(updates as any);
    return res.json({ success: true, message: "Settings saved" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
