/**
 * Individual API Key Management
 * DELETE /api/keys/[id] - Revoke (soft-delete) an API key
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
  }

  try {
    // Find the key and verify ownership before revoking
    const existingKey = await db.apiKey.findFirst({
      where: { id, userId: user.id },
      select: { id: true, isActive: true },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    if (!existingKey.isActive) {
      return NextResponse.json(
        { error: "API key is already revoked" },
        { status: 400 }
      );
    }

    // Soft delete - set isActive to false
    await db.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "API key revoked" });
  } catch (error) {
    console.error(`[keys/${id} DELETE] Unexpected error:`, error);
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}
