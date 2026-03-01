/**
 * Coupon Redemption API
 * POST /api/coupons/redeem - Redeem a coupon code to upgrade the user's plan
 *
 * Body: { code: string }
 *
 * Steps:
 * 1. Validate and look up coupon (case-insensitive, stored/checked as uppercase)
 * 2. Check expiry and redemption limits
 * 3. Ensure user has not already redeemed this coupon
 * 4. Apply coupon in a transaction: create redemption, increment counter,
 *    update subscription plan + period end, log activity
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import db from "@/lib/db";
import { provisionFreePlan } from "@/lib/usage";

export async function POST(req: NextRequest) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    let body: { code?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    if (typeof body.code !== "string" || !body.code.trim()) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const code = body.code.toUpperCase().trim();

    if (code.length > 50) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    // Look up coupon with its associated plan
    const coupon = await db.couponCode.findUnique({
      where: { code },
      include: { plan: true },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    }

    if (coupon.timesRedeemed >= coupon.maxRedemptions) {
      return NextResponse.json(
        { error: "This coupon has reached its redemption limit" },
        { status: 400 }
      );
    }

    // Check if this user has already redeemed the coupon
    const existing = await db.couponRedemption.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already used this coupon" },
        { status: 400 }
      );
    }

    // Ensure the user has a subscription row before we try to update it
    await provisionFreePlan(user.id);

    // Calculate the new period end: now + durationMonths months
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + coupon.durationMonths);

    // Apply coupon atomically
    await db.$transaction([
      db.couponRedemption.create({
        data: { couponId: coupon.id, userId: user.id },
      }),
      db.couponCode.update({
        where: { id: coupon.id },
        data: { timesRedeemed: { increment: 1 } },
      }),
      db.userSubscription.update({
        where: { userId: user.id },
        data: {
          planId: coupon.planId,
          periodEnd,
          status: "active",
        },
      }),
      db.activityLog.create({
        data: {
          userId: user.id,
          action: "coupon_redeemed",
          details: {
            code,
            planId: coupon.planId,
            durationMonths: coupon.durationMonths,
          },
        },
      }),
    ]);

    const months = coupon.durationMonths;
    return NextResponse.json({
      success: true,
      message: `Coupon applied! You have been upgraded to ${coupon.plan.displayName} for ${months} month${months > 1 ? "s" : ""}.`,
    });
  } catch (error) {
    console.error("[api/coupons/redeem] Error:", error);
    return NextResponse.json({ error: "Failed to redeem coupon" }, { status: 500 });
  }
}
