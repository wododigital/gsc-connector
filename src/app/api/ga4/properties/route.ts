/**
 * GA4 Properties API
 * POST /api/ga4/properties - Update which GA4 properties are active
 *
 * Body: { propertyIds: string[] }
 * Only the listed property IDs will be marked active; all others deactivated.
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    let body: { propertyIds?: unknown };
    try {
      body = (await req.json()) as { propertyIds?: unknown };
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    const { propertyIds } = body;

    if (!Array.isArray(propertyIds)) {
      return NextResponse.json(
        { error: "propertyIds must be an array of property ID strings" },
        { status: 400 }
      );
    }

    const ids = propertyIds as string[];

    if (!ids.every((id) => typeof id === "string")) {
      return NextResponse.json(
        { error: "All entries in propertyIds must be strings" },
        { status: 400 }
      );
    }

    if (ids.length > 0) {
      const owned = await db.ga4Property.findMany({
        where: { id: { in: ids }, userId: user.id },
        select: { id: true },
      });
      const ownedIds = new Set(owned.map((p) => p.id));
      const invalid = ids.filter((id) => !ownedIds.has(id));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: "One or more property IDs are invalid or do not belong to you" },
          { status: 400 }
        );
      }
    }

    // Deactivate all, then activate selected
    await db.ga4Property.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    if (ids.length > 0) {
      await db.ga4Property.updateMany({
        where: { id: { in: ids }, userId: user.id },
        data: { isActive: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ga4/properties POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to update GA4 properties" },
      { status: 500 }
    );
  }
}
