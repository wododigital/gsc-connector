/**
 * Admin: list pro plan enquiries.
 * GET /api/admin/pro-requests?status=new|contacted|qualified|won|lost|all&page=1
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

const ALLOWED_STATUSES = new Set(["new", "contacted", "qualified", "won", "lost"]);

export async function GET(req: NextRequest) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  const { searchParams } = new URL(req.url);
  const statusParam = (searchParams.get("status") ?? "all").toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = 50;
  const skip = (page - 1) * limit;

  const where = ALLOWED_STATUSES.has(statusParam) ? { status: statusParam } : {};

  try {
    const [requests, total, counts] = await Promise.all([
      db.proRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.proRequest.count({ where }),
      db.proRequest.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const countsByStatus = counts.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = c._count._all;
      return acc;
    }, {});

    return NextResponse.json({
      requests,
      total,
      page,
      limit,
      counts: countsByStatus,
    });
  } catch (error) {
    console.error("[admin/pro-requests] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch enquiries" }, { status: 500 });
  }
}
