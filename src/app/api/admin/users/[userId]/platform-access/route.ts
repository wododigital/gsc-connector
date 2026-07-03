/**
 * Admin: grant/revoke gated platform access (google_ads, gtm) per user.
 * PATCH /api/admin/users/[userId]/platform-access  { platform, enabled }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";
import { isGatedPlatform, setPlatformAccess } from "@/lib/platform-access";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const body = await req.json();
    const { platform, enabled } = body as { platform?: string; enabled?: boolean };

    if (!platform || !isGatedPlatform(platform)) {
      return NextResponse.json(
        { error: "platform must be one of: google_ads, gtm" },
        { status: 400 }
      );
    }
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id: params.userId },
      select: { id: true, email: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const adminEmail = adminOrResponse.email;

    await setPlatformAccess(params.userId, platform, enabled, adminEmail);

    await db.activityLog.create({
      data: {
        userId: params.userId,
        action: enabled ? "platform_access_granted" : "platform_access_revoked",
        details: { platform, grantedBy: adminEmail },
      },
    });

    return NextResponse.json({ success: true, platform, enabled });
  } catch (error) {
    console.error("[admin/users/[id]/platform-access] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update platform access" },
      { status: 500 }
    );
  }
}
