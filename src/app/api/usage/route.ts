/**
 * Usage API
 * GET /api/usage - Returns the authenticated user's current plan usage stats
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getUserUsage } from "@/lib/usage";

export async function GET(req: NextRequest) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    const usage = await getUserUsage(user.id);
    return NextResponse.json(usage);
  } catch (error) {
    console.error("[api/usage] Error:", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
