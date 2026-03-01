import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
    const search = searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;

    const where = search
      ? { email: { contains: search, mode: "insensitive" as const } }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          subscription: { include: { plan: true } },
          gscProperties: { where: { isActive: true }, select: { id: true } },
          ga4Properties: { where: { isActive: true }, select: { id: true } },
          googleCredentials: { select: { scopes: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      plan: u.subscription?.plan?.displayName ?? "Free",
      planId: u.subscription?.planId ?? "plan_free",
      callsUsed: u.subscription?.callsUsed ?? 0,
      callsLimit: u.subscription?.plan?.monthlyCalls ?? 100,
      gscPropertiesCount: u.gscProperties.length,
      ga4PropertiesCount: u.ga4Properties.length,
      hasAnalyticsScope: u.googleCredentials.some((c) =>
        c.scopes.includes("analytics.readonly")
      ),
      subscriptionStatus: u.subscription?.status ?? "active",
    }));

    return NextResponse.json({ users: result, total, page, limit });
  } catch (error) {
    console.error("[admin/users] Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
