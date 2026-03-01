import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const body = await req.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    const plan = await db.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const sub = await db.userSubscription.upsert({
      where: { userId: params.userId },
      update: {
        planId,
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: params.userId,
        planId,
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await db.activityLog.create({
      data: {
        userId: params.userId,
        action: "plan_changed_by_admin",
        details: { planId, planName: plan.name },
      },
    });

    return NextResponse.json({ success: true, subscription: sub });
  } catch (error) {
    console.error("[admin/users/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update user plan" }, { status: 500 });
  }
}
