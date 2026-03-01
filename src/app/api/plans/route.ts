/**
 * Plans API
 * GET /api/plans - Returns all active pricing plans ordered by sort order
 */

import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const plans = await db.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("[api/plans] Error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
