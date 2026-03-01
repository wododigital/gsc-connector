/**
 * API Key Management
 * GET  /api/keys - List user's API keys (prefix, name, status, last used)
 * POST /api/keys - Create a new API key (returns full key ONE TIME ONLY)
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import db from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

// ----------------------------------------------------------------
// GET - List API keys (never returns the full key or hash)
// ----------------------------------------------------------------
export async function GET(req: NextRequest) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    const keys = await db.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("[keys GET] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

// ----------------------------------------------------------------
// POST - Create a new API key
// Body (optional): { name: string }
// Returns the full key ONE TIME - it cannot be retrieved again.
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    let body: { name?: string } = {};
    try {
      body = (await req.json()) as { name?: string };
    } catch {
      // Empty body is fine - name defaults to "Default"
    }

    const name =
      typeof body.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : "Default";

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Key name must be 100 characters or fewer" },
        { status: 400 }
      );
    }

    // Limit total keys per user to prevent abuse
    const existingKeyCount = await db.apiKey.count({
      where: { userId: user.id, isActive: true },
    });
    if (existingKeyCount >= 10) {
      return NextResponse.json(
        { error: "Maximum of 10 active API keys allowed. Revoke an existing key first." },
        { status: 400 }
      );
    }

    // Generate the raw key: format gsc_<64 hex chars>
    const rawKeyHex = randomBytes(32).toString("hex");
    const fullKey = `gsc_${rawKeyHex}`;

    // Store only the SHA-256 hash - the plaintext is never stored
    const keyHash = createHash("sha256").update(fullKey).digest("hex");

    // First 12 chars of the key (after "gsc_") for display/identification
    const keyPrefix = fullKey.slice(0, 12);

    const apiKey = await db.apiKey.create({
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

    // Return the full key only in this response - it will never be shown again
    return NextResponse.json(
      {
        key: fullKey,
        ...apiKey,
        warning: "Save this key now. It will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[keys POST] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}
