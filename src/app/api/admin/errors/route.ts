import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get("hours") ?? "24");
    const service = searchParams.get("service") ?? "all";

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const where: Record<string, unknown> = {
      status: "error",
      timestamp: { gte: since },
    };
    if (service !== "all") where.service = service;

    const [errors, totalErrors, gscErrors, ga4Errors, tokenErrors] = await Promise.all([
      db.mcpDebugLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: 200,
        select: {
          id: true,
          timestamp: true,
          tool: true,
          userId: true,
          service: true,
          errorMessage: true,
          siteUrl: true,
        },
      }),
      db.mcpDebugLog.count({ where }),
      db.mcpDebugLog.count({ where: { ...where, service: "gsc" } }),
      db.mcpDebugLog.count({ where: { ...where, service: "ga4" } }),
      db.mcpDebugLog.count({
        where: {
          status: "error",
          timestamp: { gte: since },
          OR: [
            { errorMessage: { contains: "token" } },
            { errorMessage: { contains: "refresh" } },
            { errorMessage: { contains: "auth" } },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      errors,
      summary: { total: totalErrors, gsc: gscErrors, ga4: ga4Errors, tokenIssues: tokenErrors },
    });
  } catch (error) {
    console.error("[admin/errors] Error:", error);
    return NextResponse.json({ error: "Failed to fetch errors" }, { status: 500 });
  }
}
