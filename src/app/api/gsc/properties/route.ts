/**
 * GSC Properties API
 * GET  /api/gsc/properties - List user's connected GSC properties
 * POST /api/gsc/properties - Update which properties are active
 *
 * Body for POST: { propertyIds: string[] }
 * Only the listed property IDs will be marked active; all others deactivated.
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

// ----------------------------------------------------------------
// GET - List all GSC properties for the authenticated user
// ----------------------------------------------------------------
export async function GET(req: NextRequest) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    const properties = await db.gscProperty.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        siteUrl: true,
        permissionLevel: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("[gsc/properties GET] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------
// POST - Activate or deactivate properties
// Body: { propertyIds: string[] }
// ----------------------------------------------------------------
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

    // Validate all entries are strings
    if (!ids.every((id) => typeof id === "string")) {
      return NextResponse.json(
        { error: "All entries in propertyIds must be strings" },
        { status: 400 }
      );
    }

    if (ids.length > 0) {
      // Verify all supplied IDs belong to this user
      const ownedProperties = await db.gscProperty.findMany({
        where: { id: { in: ids }, userId: user.id },
        select: { id: true },
      });

      const ownedIds = new Set(ownedProperties.map((p) => p.id));
      const invalid = ids.filter((id) => !ownedIds.has(id));

      if (invalid.length > 0) {
        return NextResponse.json(
          { error: "One or more property IDs are invalid or do not belong to you" },
          { status: 400 }
        );
      }
    }

    // Deactivate all user's properties, then activate the selected subset
    await db.gscProperty.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    if (ids.length > 0) {
      await db.gscProperty.updateMany({
        where: { id: { in: ids }, userId: user.id },
        data: { isActive: true },
      });
    }

    const updatedProperties = await db.gscProperty.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        siteUrl: true,
        permissionLevel: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ properties: updatedProperties });
  } catch (error) {
    console.error("[gsc/properties POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to update properties" },
      { status: 500 }
    );
  }
}
