/**
 * OAuth2 Token Revocation
 * RFC 7009 - POST /api/oauth/revoke
 *
 * Always returns 200, even if the token is not found.
 * Tries access_token first, then refresh_token.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    let token: string | null = null;
    let token_type_hint: string | null = null;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      token = params.get("token");
      token_type_hint = params.get("token_type_hint");
    } else {
      try {
        const body = (await req.json()) as Record<string, string>;
        token = body.token ?? null;
        token_type_hint = body.token_type_hint ?? null;
      } catch {
        // Malformed body - still return 200 per RFC 7009
        return new NextResponse(null, { status: 200 });
      }
    }

    if (!token) {
      // Per RFC 7009: always return 200
      return new NextResponse(null, { status: 200 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    if (token_type_hint === "refresh_token") {
      // Try refresh token first
      await db.oAuthToken
        .deleteMany({ where: { refreshTokenHash: tokenHash } })
        .catch(() => null);
      // Also attempt access token in case hint was wrong
      await db.oAuthToken
        .deleteMany({ where: { accessTokenHash: tokenHash } })
        .catch(() => null);
    } else {
      // Default: try access token first, then refresh token
      await db.oAuthToken
        .deleteMany({ where: { accessTokenHash: tokenHash } })
        .catch(() => null);
      await db.oAuthToken
        .deleteMany({ where: { refreshTokenHash: tokenHash } })
        .catch(() => null);
    }

    // Per RFC 7009 - always return 200
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[oauth/revoke] Unexpected error:", error);
    // Still return 200 per RFC 7009
    return new NextResponse(null, { status: 200 });
  }
}
