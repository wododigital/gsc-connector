/**
 * Rotate the user's single API key.
 * POST /api/keys/regenerate - revokes any existing active key and creates a new one.
 * Returns the new full key ONE TIME ONLY.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import db from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  let body: { name?: string } = {};
  try {
    body = (await req.json()) as { name?: string };
  } catch {
    // empty body is fine
  }
  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim().slice(0, 100)
      : "Default";

  try {
    const rawKeyHex = randomBytes(32).toString("hex");
    const fullKey = `gsc_${rawKeyHex}`;
    const keyHash = createHash("sha256").update(fullKey).digest("hex");
    const keyPrefix = fullKey.slice(0, 12);

    // Revoke any existing active keys, then create the new one, atomically.
    const apiKey = await db.$transaction(async (tx) => {
      await tx.apiKey.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });
      return tx.apiKey.create({
        data: {
          userId: user.id,
          keyHash,
          keyPrefix,
          name,
          isActive: true,
        },
        select: {
          id: true,
          keyPrefix: true,
          name: true,
          isActive: true,
          lastUsedAt: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json(
      {
        key: fullKey,
        ...apiKey,
        warning: "Save this key now. It will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[keys/regenerate POST] error:", error);
    return NextResponse.json({ error: "Failed to regenerate API key" }, { status: 500 });
  }
}
