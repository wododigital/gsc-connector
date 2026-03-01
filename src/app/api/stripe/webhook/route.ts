import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICE_PLAN_MAP } from "@/lib/stripe";
import db from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.arrayBuffer();
    const body = Buffer.from(rawBody);
    const signature = req.headers.get("stripe-signature");

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[stripe/webhook] Error handling ${event.type}:`, err);
    await db.adminNotification.create({
      data: {
        type: "webhook_error",
        title: `Webhook error: ${event.type}`,
        message: msg,
        severity: "error",
        metadata: { event_type: event.type, event_id: event.id },
      },
    }).catch(() => {});
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  if (!userId || !planId) return;

  await db.userSubscription.upsert({
    where: { userId },
    update: {
      planId,
      status: "active",
      callsUsed: 0,
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
    },
    create: {
      userId,
      planId,
      status: "active",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await db.activityLog.create({
    data: {
      userId,
      action: "payment_success",
      details: { plan_id: planId, stripe_session_id: session.id, amount: session.amount_total },
    },
  });

  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  await db.adminNotification.create({
    data: {
      type: "payment_success",
      title: "New subscription!",
      message: `${user?.email ?? userId} subscribed to ${planId} ($${((session.amount_total ?? 0) / 100).toFixed(2)})`,
      severity: "info",
      metadata: { user_id: userId, plan_id: planId },
    },
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id;
  if (!userId) return;

  const priceId = sub.items.data[0]?.price?.id;
  const planId = priceId ? (PRICE_PLAN_MAP[priceId] ?? undefined) : undefined;

  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "past_due",
    trialing: "trialing",
  };

  await db.userSubscription.updateMany({
    where: { userId },
    data: {
      ...(planId ? { planId } : {}),
      status: statusMap[sub.status] ?? "active",
      cancelledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : undefined,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id;
  if (!userId) return;

  await db.userSubscription.updateMany({
    where: { userId },
    data: {
      planId: "plan_free",
      status: "active",
      callsUsed: 0,
      stripeSubscriptionId: null,
      cancelledAt: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  await db.adminNotification.create({
    data: {
      type: "subscription_cancelled",
      title: "Subscription cancelled",
      message: `${user?.email ?? userId} cancelled their subscription`,
      severity: "warning",
      metadata: { user_id: userId },
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const sub = await db.userSubscription.findFirst({ where: { stripeCustomerId: customerId } });
  if (!sub) return;

  await db.userSubscription.update({
    where: { id: sub.id },
    data: { callsUsed: 0 },
  });

  await db.activityLog.create({
    data: {
      userId: sub.userId,
      action: "payment_success",
      details: { amount: invoice.amount_paid, invoice_id: invoice.id },
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const sub = await db.userSubscription.findFirst({ where: { stripeCustomerId: customerId } });
  if (!sub) return;

  await db.userSubscription.update({
    where: { id: sub.id },
    data: { status: "past_due" },
  });

  const user = await db.user.findUnique({ where: { id: sub.userId }, select: { email: true } });
  await db.adminNotification.create({
    data: {
      type: "payment_failed",
      title: "Payment failed!",
      message: `${user?.email ?? sub.userId} - payment of $${((invoice.amount_due ?? 0) / 100).toFixed(2)} failed`,
      severity: "error",
      metadata: { user_id: sub.userId, invoice_id: invoice.id },
    },
  });

  await db.activityLog.create({
    data: {
      userId: sub.userId,
      action: "payment_failed",
      details: { amount: invoice.amount_due, invoice_id: invoice.id },
    },
  });
}
