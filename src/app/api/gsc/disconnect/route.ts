/**
 * Disconnect Google Account
 * POST /api/gsc/disconnect
 *
 * Deactivates all GSC and GA4 properties, then deletes the stored
 * Google credential so the user must reconnect from scratch.
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    await db.gscProperty.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    await db.ga4Property.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    await db.googleCredential.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[gsc/disconnect POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
