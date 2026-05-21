/**
 * Usage tracking and plan enforcement.
 * Called before each MCP tool execution to check limits and increment counter.
 *
 * Plan_free has a LIFETIME cap (no period reset). When exhausted, the user
 * is directed to /pricing#enquire which opens the Pro plan enquiry form.
 */
import db from "./db.js";

export const FREE_PLAN_ID = "plan_free";

export interface UsageCheckResult {
  allowed: boolean;
  callsUsed: number;
  callsLimit: number;
  callsRemaining: number;
  planName: string;
  reason?: string; // set when allowed=false
}

/**
 * Check if user has quota remaining, and if so increment their counter.
 * Returns { allowed: true } if the call should proceed.
 * Returns { allowed: false, reason } if limit exceeded.
 *
 * Auto-provisions a free-plan subscription if user has none.
 */
export async function checkAndIncrementUsage(userId: string): Promise<UsageCheckResult> {
  // Get or auto-provision subscription
  let sub = await db.userSubscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!sub) {
    // Auto-provision free plan
    const freePlan = await db.plan.findUnique({ where: { id: FREE_PLAN_ID } });
    if (!freePlan) {
      // Plans not seeded yet - allow the call but don't track
      return { allowed: true, callsUsed: 0, callsLimit: 100, callsRemaining: 100, planName: "free" };
    }
    sub = await db.userSubscription.create({
      data: {
        userId,
        planId: FREE_PLAN_ID,
        // Lifetime cap - set periodEnd far in the future to satisfy the
        // schema while preventing any reset logic from firing.
        periodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }

  // Reset period if expired - but ONLY for paid plans. plan_free is a
  // lifetime cap (one-shot trial quota), so we never roll the counter over.
  if (sub.planId !== FREE_PLAN_ID && sub.periodEnd < new Date()) {
    sub = await db.userSubscription.update({
      where: { userId },
      data: {
        callsUsed: 0,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }

  const limit = sub.plan.monthlyCalls;
  const used = sub.callsUsed;

  if (used >= limit) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const reason =
      sub.planId === FREE_PLAN_ID
        ? `Free trial limit of ${limit} tool calls reached. Request access to the paid plan at ${appUrl}/pricing#enquire and our team will reach out to activate your subscription.`
        : `Plan limit of ${limit} tool calls reached. Upgrade your plan at ${appUrl}/dashboard/billing`;
    return {
      allowed: false,
      callsUsed: used,
      callsLimit: limit,
      callsRemaining: 0,
      planName: sub.plan.name,
      reason,
    };
  }

  // Increment usage
  await db.userSubscription.update({
    where: { userId },
    data: { callsUsed: { increment: 1 } },
  });

  return {
    allowed: true,
    callsUsed: used + 1,
    callsLimit: limit,
    callsRemaining: limit - used - 1,
    planName: sub.plan.name,
  };
}

/**
 * Get current usage stats for a user (no increment).
 */
export async function getUserUsage(userId: string) {
  let sub = await db.userSubscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!sub) {
    await provisionFreePlan(userId);
    sub = await db.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  if (!sub) {
    const farFuture = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
    return {
      plan: "free",
      display_name: "Free",
      calls_used: 0,
      calls_limit: 100,
      calls_remaining: 100,
      percentage_used: 0,
      period_start: new Date().toISOString(),
      period_end: farFuture.toISOString(),
      status: "active",
      price_cents: 0,
      features: [],
    };
  }

  const used = sub.callsUsed;
  const limit = sub.plan.monthlyCalls;

  return {
    plan: sub.plan.name,
    display_name: sub.plan.displayName,
    calls_used: used,
    calls_limit: limit,
    calls_remaining: Math.max(0, limit - used),
    percentage_used: Math.round((used / limit) * 100),
    period_start: sub.periodStart.toISOString(),
    period_end: sub.periodEnd.toISOString(),
    status: sub.status,
    price_cents: sub.plan.priceCents,
    features: sub.plan.features as string[],
    stripe_subscription_id: sub.stripeSubscriptionId,
  };
}

/**
 * Provision a free plan subscription for a new user.
 * Safe to call multiple times (no-op if subscription exists).
 */
export async function provisionFreePlan(userId: string): Promise<void> {
  const existing = await db.userSubscription.findUnique({ where: { userId } });
  if (existing) return;

  // Free is a lifetime quota - set periodEnd far in the future so the
  // schema's required Datetime stays satisfied without ever triggering a reset.
  await db.userSubscription.create({
    data: {
      userId,
      planId: FREE_PLAN_ID,
      periodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
    },
  });
}
