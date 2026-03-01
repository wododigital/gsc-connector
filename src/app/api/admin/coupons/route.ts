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

    if (typeof code !== "string" || !code.trim() || !planId) {
      return NextResponse.json({ error: "code and planId are required" }, { status: 400 });
    }

    // Validate code format - alphanumeric + underscores, max 50 chars
    const sanitizedCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_]{1,50}$/.test(sanitizedCode)) {
      return NextResponse.json(
        { error: "Code must be 1-50 alphanumeric characters or underscores" },
        { status: 400 }
      );
    }

    const parsedDuration = parseInt(String(durationMonths));
    const parsedMaxRedemptions = parseInt(String(maxRedemptions));

    if (isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 120) {
      return NextResponse.json({ error: "durationMonths must be between 1 and 120" }, { status: 400 });
    }
    if (isNaN(parsedMaxRedemptions) || parsedMaxRedemptions < 1 || parsedMaxRedemptions > 100000) {
      return NextResponse.json({ error: "maxRedemptions must be between 1 and 100000" }, { status: 400 });
    }

    if (typeof planId !== "string") {
      return NextResponse.json({ error: "planId must be a string" }, { status: 400 });
    }

    const plan = await db.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const coupon = await db.couponCode.create({
      data: {
        code: sanitizedCode,
        planId,
        durationMonths: parsedDuration,
        maxRedemptions: parsedMaxRedemptions,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      include: { plan: { select: { displayName: true } } },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: unknown) {
    // Handle unique constraint violation without leaking Prisma internals
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }
    console.error("[admin/coupons] POST error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
