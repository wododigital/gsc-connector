import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const coupons = await db.couponCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        plan: { select: { displayName: true } },
        _count: { select: { redemptions: true } },
      },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("[admin/coupons] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const body = await req.json();
    const { code, planId, durationMonths = 1, maxRedemptions = 100, expiresAt } = body;

    if (!code?.trim() || !planId) {
      return NextResponse.json({ error: "code and planId are required" }, { status: 400 });
    }

    const plan = await db.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const coupon = await db.couponCode.create({
      data: {
        code: code.trim().toUpperCase(),
        planId,
        durationMonths: parseInt(String(durationMonths)),
        maxRedemptions: parseInt(String(maxRedemptions)),
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      include: { plan: { select: { displayName: true } } },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: unknown) {
    // Unique constraint violation
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }
    console.error("[admin/coupons] POST error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
