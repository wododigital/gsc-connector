import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);

    const [
      totalUsers,
      newUsersToday,
      openTickets,
      errorsToday,
      callsToday,
      callsThisWeek,
      callsThisMonth,
      planDist,
      topToolsRaw,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: todayStart } } }),
      db.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
      db.mcpDebugLog.count({ where: { status: "error", timestamp: { gte: todayStart } } }),
      db.usageLog.count({ where: { createdAt: { gte: todayStart } } }),
      db.usageLog.count({ where: { createdAt: { gte: weekStart } } }),
      db.usageLog.count({ where: { createdAt: { gte: monthStart } } }),
      db.userSubscription.groupBy({
        by: ["planId"],
        _count: { _all: true },
      }),
      db.usageLog.groupBy({
        by: ["toolName"],
        _count: { _all: true },
        where: { createdAt: { gte: weekStart } },
        orderBy: { _count: { toolName: "desc" } },
        take: 7,
      }),
    ]);

    // Enrich planDistribution with plan names
    const planIds = planDist.map((p) => p.planId);
    const plans = await db.plan.findMany({ where: { id: { in: planIds } } });
    const planMap = Object.fromEntries(plans.map((p) => [p.id, p.displayName]));

    const planDistribution = planDist.map((p) => ({
      planId: p.planId,
      planName: planMap[p.planId] ?? p.planId,
      count: p._count._all,
    }));

    const topTools = topToolsRaw.map((t) => ({
      toolName: t.toolName,
      count: t._count._all,
    }));

    return NextResponse.json({
      totalUsers,
      newUsersToday,
      openTickets,
      errorsToday,
      callsToday,
      callsThisWeek,
      callsThisMonth,
      planDistribution,
      topTools,
    });
  } catch (error) {
    console.error("[admin/dashboard] Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
