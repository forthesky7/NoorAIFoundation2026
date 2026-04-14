import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../lib/auth";
import { CreateSubscriptionBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router = Router();

const NOWPAYMENTS_USDT_ADDRESS = process.env.NOWPAYMENTS_USDT_ADDRESS || "TNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const SUBSCRIPTION_PRICE_USDT = 5.0;

router.get("/subscription/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    const user = users[0];
    
    if (!user.subscribed || !user.subscriptionExpiresAt) {
      return res.json({ subscribed: false });
    }
    
    const now = new Date();
    const expires = new Date(user.subscriptionExpiresAt);
    if (expires < now) {
      await db.update(usersTable).set({ subscribed: false }).where(eq(usersTable.id, req.userId!));
      return res.json({ subscribed: false });
    }
    
    const daysRemaining = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return res.json({
      subscribed: true,
      plan: "NOOR AI Pro",
      expiresAt: expires.toISOString(),
      daysRemaining,
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/subscription/create", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parsed = CreateSubscriptionBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    
    const paymentId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    await db.insert(subscriptionsTable).values({
      userId: req.userId!,
      paymentId,
      paymentMethod: parsed.data.paymentMethod,
      currency: parsed.data.currency || "USDT",
      amount: SUBSCRIPTION_PRICE_USDT.toString(),
      status: "pending",
      expiresAt,
    });
    
    return res.json({
      paymentId,
      paymentUrl: `https://nowpayments.io/payment/?iid=${paymentId}`,
      paymentAddress: NOWPAYMENTS_USDT_ADDRESS,
      amount: SUBSCRIPTION_PRICE_USDT,
      currency: parsed.data.currency || "USDT",
      status: "pending",
      expiresAt: expiresAt.toISOString(),
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
