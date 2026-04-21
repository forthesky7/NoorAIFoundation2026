import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../lib/auth";
import { CreateSubscriptionBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router = Router();

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || "";
const NOWPAYMENTS_WALLET = process.env.NOWPAYMENTS_WALLET || "0xC9E65529aE5954C795036E93eB654D3858dA2AE8";
const SUBSCRIPTION_PRICE_USD = 5.0;
const PROMO_CODE = "NOOR_ADMIN_TEST";

async function createNowPaymentsInvoice(orderId: string) {
  const domain = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : "";

  const res = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: {
      "x-api-key": NOWPAYMENTS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: SUBSCRIPTION_PRICE_USD,
      price_currency: "usd",
      pay_currency: "usdterc20",
      order_id: orderId,
      order_description: "NOOR AI Pro Subscription - 1 Month",
      success_url: `${domain}/dashboard`,
      cancel_url: `${domain}/subscribe`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NOWPayments error: ${err}`);
  }
  return res.json();
}

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

    let paymentUrl = `https://nowpayments.io/payment/?iid=${paymentId}`;
    let paymentAddress = NOWPAYMENTS_WALLET;
    let invoiceId = paymentId;
    let invoiceUrl: string | null = null;

    if (NOWPAYMENTS_API_KEY) {
      try {
        const invoice = await createNowPaymentsInvoice(paymentId);
        paymentUrl = invoice.invoice_url || paymentUrl;
        invoiceUrl = invoice.invoice_url || null;
        invoiceId = invoice.id || paymentId;
      } catch (e) {
        console.error("NOWPayments invoice creation failed:", e);
      }
    }

    await db.insert(subscriptionsTable).values({
      userId: req.userId!,
      paymentId: invoiceId,
      paymentMethod: parsed.data.paymentMethod,
      currency: "USDT",
      amount: SUBSCRIPTION_PRICE_USD.toString(),
      status: "pending",
      expiresAt,
    });

    return res.json({
      paymentId: invoiceId,
      paymentUrl,
      invoiceUrl,
      paymentAddress,
      amount: SUBSCRIPTION_PRICE_USD,
      currency: "USDT",
      status: "pending",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/subscription/promo", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    if (!code || code.trim().toUpperCase() !== PROMO_CODE) {
      return res.status(400).json({ error: "كود غير صالح" });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await db.update(usersTable)
      .set({ subscribed: true, subscriptionExpiresAt: expiresAt })
      .where(eq(usersTable.id, req.userId!));

    const paymentId = `PROMO_${randomUUID()}`;
    await db.insert(subscriptionsTable).values({
      userId: req.userId!,
      paymentId,
      paymentMethod: "promo",
      currency: "PROMO",
      amount: "0",
      status: "active",
      expiresAt,
    });

    return res.json({
      success: true,
      message: "تم تفعيل الاشتراك المجاني بنجاح!",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/subscription/webhook", async (req, res) => {
  try {
    const { payment_status, order_id } = req.body;

    if (payment_status === "finished" || payment_status === "confirmed") {
      const subs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.paymentId, order_id));
      if (subs.length > 0) {
        const sub = subs[0];
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await db.update(subscriptionsTable)
          .set({ status: "active" })
          .where(eq(subscriptionsTable.paymentId, order_id));

        await db.update(usersTable)
          .set({ subscribed: true, subscriptionExpiresAt: expiresAt })
          .where(eq(usersTable.id, sub.userId));
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Webhook error" });
  }
});

export default router;
