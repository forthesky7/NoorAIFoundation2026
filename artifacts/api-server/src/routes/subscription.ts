import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../lib/auth";
import { CreateSubscriptionBody } from "@workspace/api-zod";
import { getSettings } from "../lib/settings";
import { randomUUID } from "crypto";

const router = Router();

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || "";
const SUBSCRIPTION_PRICE_USD = 5.0;
const PROMO_CODE = "NOOR_ADMIN_TEST";

async function createNowPaymentsInvoice(orderId: string) {
  const domain = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : "https://workspace--forthesky7.replit.app";

  const res = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: {
      "x-api-key": NOWPAYMENTS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: SUBSCRIPTION_PRICE_USD,
      price_currency: "usd",
      pay_currency: "usdttrc20",
      order_id: orderId,
      order_description: "NOOR AI Pro - 1 Month",
      success_url: `${domain}/dashboard`,
      cancel_url: `${domain}/subscribe`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NOWPayments: ${text}`);
  }
  return res.json();
}

async function createLemonSqueezyCheckout(userId: number, email: string, orderId: string) {
  const { LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_VARIANT_ID } = getSettings();
  const domain = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : "https://workspace--forthesky7.replit.app";

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email,
            custom: { user_id: String(userId), order_id: orderId },
          },
          product_options: { redirect_url: `${domain}/dashboard` },
        },
        relationships: {
          store: { data: { type: "stores", id: LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: "variants", id: LEMONSQUEEZY_VARIANT_ID } },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LemonSqueezy: ${text}`);
  }
  const data = await res.json();
  return data.data?.attributes?.url as string;
}

router.get("/subscription/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!users.length) return res.status(404).json({ error: "User not found" });
    const user = users[0];

    if (!user.subscribed || !user.subscriptionExpiresAt) return res.json({ subscribed: false });

    const now = new Date();
    const expires = new Date(user.subscriptionExpiresAt);
    if (expires < now) {
      await db.update(usersTable).set({ subscribed: false }).where(eq(usersTable.id, req.userId!));
      return res.json({ subscribed: false });
    }

    const daysRemaining = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return res.json({ subscribed: true, plan: "NOOR AI Pro", expiresAt: expires.toISOString(), daysRemaining });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/subscription/create", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parsed = CreateSubscriptionBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    const user = users[0];
    const orderId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { paymentMethod } = parsed.data;

    if (paymentMethod === "card") {
      const settings = getSettings();
      if (!settings.LEMONSQUEEZY_API_KEY || !settings.LEMONSQUEEZY_STORE_ID || !settings.LEMONSQUEEZY_VARIANT_ID) {
        return res.status(503).json({
          error: "Card payment is not configured yet.",
          configured: false,
        });
      }

      const checkoutUrl = await createLemonSqueezyCheckout(req.userId!, user?.email || "", orderId);

      await db.insert(subscriptionsTable).values({
        userId: req.userId!,
        paymentId: orderId,
        paymentMethod: "card",
        currency: "USD",
        amount: SUBSCRIPTION_PRICE_USD.toString(),
        status: "pending",
        expiresAt,
      });

      return res.json({ paymentId: orderId, paymentUrl: checkoutUrl, status: "pending", method: "card" });
    }

    if (!NOWPAYMENTS_API_KEY) {
      const settings = getSettings();
      const walletAddr = settings.NOWPAYMENTS_WALLET_TRC20 || "";
      await db.insert(subscriptionsTable).values({
        userId: req.userId!,
        paymentId: orderId,
        paymentMethod: "crypto",
        currency: "USDT-TRC20",
        amount: SUBSCRIPTION_PRICE_USD.toString(),
        status: "pending",
        expiresAt,
      });
      return res.json({
        paymentId: orderId,
        paymentAddress: walletAddr,
        network: "TRC20 (Tron)",
        amount: SUBSCRIPTION_PRICE_USD,
        currency: "USDT",
        status: "pending",
        invoiceUrl: null,
      });
    }

    let invoice: any = null;
    try {
      invoice = await createNowPaymentsInvoice(orderId);
    } catch (e) {
      console.error("NOWPayments invoice error:", e);
    }

    await db.insert(subscriptionsTable).values({
      userId: req.userId!,
      paymentId: invoice?.id || orderId,
      paymentMethod: "crypto",
      currency: "USDT-TRC20",
      amount: SUBSCRIPTION_PRICE_USD.toString(),
      status: "pending",
      expiresAt,
    });

    const settings = getSettings();
    return res.json({
      paymentId: invoice?.id || orderId,
      invoiceUrl: invoice?.invoice_url || null,
      paymentUrl: invoice?.invoice_url || null,
      paymentAddress: settings.NOWPAYMENTS_WALLET_TRC20 || "",
      network: "TRC20 (Tron)",
      amount: SUBSCRIPTION_PRICE_USD,
      currency: "USDT",
      status: "pending",
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err?.message });
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

    await db.update(usersTable).set({ subscribed: true, subscriptionExpiresAt: expiresAt }).where(eq(usersTable.id, req.userId!));

    const promoId = `PROMO_${randomUUID()}`;
    await db.insert(subscriptionsTable).values({
      userId: req.userId!,
      paymentId: promoId,
      paymentMethod: "promo",
      currency: "PROMO",
      amount: "0",
      status: "active",
      expiresAt,
    });

    return res.json({ success: true, message: "تم تفعيل الاشتراك المجاني بنجاح!", expiresAt: expiresAt.toISOString() });
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
        await db.update(subscriptionsTable).set({ status: "active" }).where(eq(subscriptionsTable.paymentId, order_id));
        await db.update(usersTable).set({ subscribed: true, subscriptionExpiresAt: expiresAt }).where(eq(usersTable.id, sub.userId));
      }
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Webhook error" });
  }
});

router.post("/subscription/ls-webhook", async (req, res) => {
  try {
    const eventName = req.headers["x-event-name"] as string;
    if (eventName === "order_created" || eventName === "subscription_created") {
      const orderId = req.body?.meta?.custom_data?.order_id;
      const userId = parseInt(req.body?.meta?.custom_data?.user_id || "0");
      if (orderId && userId) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await db.update(subscriptionsTable).set({ status: "active" }).where(eq(subscriptionsTable.paymentId, orderId));
        await db.update(usersTable).set({ subscribed: true, subscriptionExpiresAt: expiresAt }).where(eq(usersTable.id, userId));
      }
    }
    return res.json({ received: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Webhook error" });
  }
});

export default router;
