/**
 * OAuth2 Token Endpoint
 * POST /api/oauth/token
 *
 * Supports:
 * - grant_type=authorization_code (with PKCE verification)
 * - grant_type=refresh_token (with token rotation)
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import db from "@/lib/db";

// ----------------------------------------------------------------
// Client credential extraction helpers
// ----------------------------------------------------------------
function extractClientCredentials(
  req: NextRequest,
  body: Record<string, string>
): { clientId: string | null; clientSecret: string | null } {
  // Try Authorization: Basic header first
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("basic ")) {
    const base64 = authHeader.slice(6);
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    const colonIndex = decoded.indexOf(":");
    if (colonIndex !== -1) {
      return {
        clientId: decodeURIComponent(decoded.slice(0, colonIndex)),
        clientSecret: decodeURIComponent(decoded.slice(colonIndex + 1)),
      };
    }
  }

  // Fall back to request body
  return {
    clientId: body.client_id ?? null,
    clientSecret: body.client_secret ?? null,
  };
}

async function validateClient(
  clientId: string | null,
  clientSecret: string | null,
  requireSecret: boolean
): Promise<{ valid: boolean; client: { id: string; clientId: string } | null }> {
  if (!clientId) return { valid: false, client: null };

  const client = await db.oAuthClient.findUnique({
    where: { clientId },
    select: { id: true, clientId: true, clientSecretHash: true, tokenEndpointAuthMethod: true },
  });

  if (!client) return { valid: false, client: null };

  // If auth method is "none", secret is not required
  if (client.tokenEndpointAuthMethod === "none" && !requireSecret) {
    return { valid: true, client: { id: client.id, clientId: client.clientId } };
  }

  if (!clientSecret) return { valid: false, client: null };

  const secretHash = createHash("sha256").update(clientSecret).digest("hex");
  if (secretHash !== client.clientSecretHash) return { valid: false, client: null };

  return { valid: true, client: { id: client.id, clientId: client.clientId } };
}

// ----------------------------------------------------------------
// PKCE verification: base64url(SHA256(verifier)) === challenge
// ----------------------------------------------------------------
function verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
  const computed = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return computed === codeChallenge;
}

// ----------------------------------------------------------------
// Token generation helpers
// ----------------------------------------------------------------
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ----------------------------------------------------------------
// POST handler
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  // OAuth token endpoint accepts form-encoded body
  let rawBody: Record<string, string>;
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    rawBody = Object.fromEntries(params.entries());
  } else {
    // Also accept JSON for convenience
    try {
      rawBody = (await req.json()) as Record<string, string>;
    } catch {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Unsupported content type" },
        { status: 400 }
      );
    }
  }

  const grant_type = rawBody.grant_type;

  // ----------------------------------------------------------------
  // Grant: authorization_code
  // ----------------------------------------------------------------
  if (grant_type === "authorization_code") {
    const { code, redirect_uri, code_verifier } = rawBody;

    if (!code) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "code is required" },
        { status: 400 }
      );
    }

    if (!redirect_uri) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "redirect_uri is required" },
        { status: 400 }
      );
    }

    const { clientId, clientSecret } = extractClientCredentials(req, rawBody);
    const { valid } = await validateClient(clientId, clientSecret, false);

    if (!valid) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Invalid client credentials" },
        { status: 401 }
      );
    }

    // Look up the authorization code by its hash
    const codeHash = hashToken(code);
    const authCode = await db.oAuthAuthorizationCode.findUnique({
      where: { codeHash },
    });

    if (!authCode) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Authorization code not found" },
        { status: 400 }
      );
    }

    // Check expiry
    if (authCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Authorization code has expired" },
        { status: 400 }
      );
    }

    // Check single-use
    if (authCode.used) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Authorization code has already been used" },
        { status: 400 }
      );
    }

    // Check client_id matches
    if (authCode.clientId !== clientId) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "client_id mismatch" },
        { status: 400 }
      );
    }

    // Check redirect_uri matches
    if (authCode.redirectUri !== redirect_uri) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "redirect_uri mismatch" },
        { status: 400 }
      );
    }

    // PKCE verification (required if code_challenge was set)
    if (authCode.codeChallenge) {
      if (!code_verifier) {
        return NextResponse.json(
          { error: "invalid_grant", error_description: "code_verifier is required" },
          { status: 400 }
        );
      }
      // Only S256 is accepted - plain method is insecure and not supported
      if (authCode.codeChallengeMethod !== "S256") {
        return NextResponse.json(
          { error: "invalid_grant", error_description: "Unsupported code_challenge_method" },
          { status: 400 }
        );
      }
      if (!verifyPkce(code_verifier, authCode.codeChallenge)) {
        return NextResponse.json(
          { error: "invalid_grant", error_description: "PKCE verification failed" },
          { status: 400 }
        );
      }
    }

    // Mark code as used (single-use enforcement)
    await db.oAuthAuthorizationCode.update({
      where: { id: authCode.id },
      data: { used: true },
    });

    // Generate tokens
    const accessToken = generateToken();
    const refreshToken = generateToken();
    const accessTokenHash = hashToken(accessToken);
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await db.oAuthToken.create({
      data: {
        userId: authCode.userId,
        clientId: authCode.clientId,
        accessTokenHash,
        refreshTokenHash,
        propertyId: authCode.propertyId,
        scopes: authCode.scopes,
        expiresAt,
      },
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: authCode.scopes,
    });
  }

  // ----------------------------------------------------------------
  // Grant: refresh_token
  // ----------------------------------------------------------------
  if (grant_type === "refresh_token") {
    const { refresh_token } = rawBody;

    if (!refresh_token) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "refresh_token is required" },
        { status: 400 }
      );
    }

    const { clientId, clientSecret } = extractClientCredentials(req, rawBody);
    const { valid } = await validateClient(clientId, clientSecret, false);

    if (!valid) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Invalid client credentials" },
        { status: 401 }
      );
    }

    // Look up stored token by refresh token hash
    const refreshTokenHash = hashToken(refresh_token);
    const existingToken = await db.oAuthToken.findUnique({
      where: { refreshTokenHash },
    });

    if (!existingToken) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Refresh token not found or revoked" },
        { status: 400 }
      );
    }

    // Verify client ownership
    if (existingToken.clientId !== clientId) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "client_id mismatch" },
        { status: 400 }
      );
    }

    // Generate new tokens (token rotation)
    const newAccessToken = generateToken();
    const newRefreshToken = generateToken();
    const newAccessTokenHash = hashToken(newAccessToken);
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 3600 * 1000);

    // Replace existing token record with new one
    await db.oAuthToken.update({
      where: { id: existingToken.id },
      data: {
        accessTokenHash: newAccessTokenHash,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
      },
    });

    return NextResponse.json({
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: newRefreshToken,
      scope: existingToken.scopes,
    });
  }

  // Unsupported grant type
  return NextResponse.json(
    {
      error: "unsupported_grant_type",
      error_description: `Grant type '${grant_type}' is not supported`,
    },
    { status: 400 }
  );
}
