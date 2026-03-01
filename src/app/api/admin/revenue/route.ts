import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Active paid subscriptions
    const paidSubs = await db.userSubscription.findMany({
      where: { status: "active" },
      include: { plan: { select: { priceCents: true, displayName: true } } },
    });

    const mrrCents = paidSubs.reduce((sum, s) => sum + (s.plan.priceCents ?? 0), 0);

    // Subscriber counts by plan
    const subsByPlan = await db.userSubscription.groupBy({
      by: ["planId"],
      where: { status: "active" },
      _count: { _all: true },
    });

    const planIds = subsByPlan.map((s) => s.planId);
    const plans = await db.plan.findMany({ where: { id: { in: planIds } } });
    const planMap = Object.fromEntries(plans.map((p) => [p.id, p]));

    const subscribers = subsByPlan
      .filter((s) => (planMap[s.planId]?.priceCents ?? 0) > 0)
      .map((s) => ({
        planId: s.planId,
        displayName: planMap[s.planId]?.displayName ?? s.planId,
        priceCents: planMap[s.planId]?.priceCents ?? 0,
        count: s._count._all,
      }));

    // Recent payment activity
    const recentPayments = await db.activityLog.findMany({
      where: {
        action: { in: ["payment_success", "payment_failed"] },
        createdAt: { gte: monthAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Enrich with emails
    const userIds = [
      ...new Set(
        recentPayments.filter((l) => l.userId).map((l) => l.userId as string)
      ),
    ];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.email]));

    const enrichedPayments = recentPayments.map((p) => ({
      ...p,
      userEmail: p.userId ? (userMap[p.userId] ?? "Unknown") : "Unknown",
    }));

    // Churn in last 30 days
    const churn30d = await db.userSubscription.count({
      where: { cancelledAt: { gte: monthAgo } },
    });

    return NextResponse.json({
      mrr: {
        cents: mrrCents,
        formatted: `$${(mrrCents / 100).toFixed(2)}`,
        arr_formatted: `$${((mrrCents * 12) / 100).toFixed(2)}`,
      },
      subscribers,
      recent_payments: enrichedPayments,
      churn_30d: churn30d,
    });
  } catch (error) {
    console.error("[admin/revenue] Error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 });
  }
}
