import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 50;
    const skip = (page - 1) * limit;

    const where = action && action !== "all" ? { action } : {};

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.activityLog.count({ where }),
    ]);

    // Enrich with user emails
    const userIds = [
      ...new Set(logs.filter((l) => l.userId).map((l) => l.userId as string)),
    ];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.email]));

    const enriched = logs.map((l) => ({
      ...l,
      userEmail: l.userId ? (userMap[l.userId] ?? "Unknown") : "System",
    }));

    return NextResponse.json({ logs: enriched, total, page, limit });
  } catch (error) {
    console.error("[admin/activity] Error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
