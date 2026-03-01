/**
 * Usage tracking and plan enforcement.
 * Called before each MCP tool execution to check limits and increment counter.
 */
import db from "./db.js";

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
    const freePlan = await db.plan.findUnique({ where: { id: "plan_free" } });
    if (!freePlan) {
      // Plans not seeded yet - allow the call but don't track
      return { allowed: true, callsUsed: 0, callsLimit: 100, callsRemaining: 100, planName: "free" };
    }
    sub = await db.userSubscription.create({
      data: {
        userId,
        planId: "plan_free",
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }

  // Reset period if expired
  if (sub.periodEnd < new Date()) {
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
    return {
      allowed: false,
      callsUsed: used,
      callsLimit: limit,
      callsRemaining: 0,
      planName: sub.plan.name,
      reason: `Monthly limit of ${limit} tool calls reached. Upgrade your plan at ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing`,
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
    return {
      plan: "plan_free",
      display_name: "Free",
      calls_used: 0,
      calls_limit: 100,
      calls_remaining: 100,
      percentage_used: 0,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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

  await db.userSubscription.create({
    data: {
      userId,
      planId: "plan_free",
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}
