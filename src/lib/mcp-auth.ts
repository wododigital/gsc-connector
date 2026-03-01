/**
 * MCP token validation - framework-agnostic (no Express dependency).
 * Used by the Next.js /api/mcp route handler.
 */

import { createHash } from "crypto";
import db from "@/lib/db";
import { checkAndIncrementUsage } from "@/lib/usage";

export interface McpUser {
  userId: string;
  propertyId: string;
  siteUrl: string;
  scopes: string;
  source: string;
}

class McpAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly wwwAuthenticate?: string
  ) {
    super(message);
    this.name = "McpAuthError";
  }
}

/**
 * Validates a Bearer token from the Authorization header.
 * Checks oauth_tokens first, falls back to api_keys.
 * Throws McpAuthError on any auth failure so the caller can return the right HTTP status.
 */
export async function validateMcpToken(authHeader: string | null): Promise<McpUser> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new McpAuthError(
      "Missing or invalid Authorization header",
      401,
      'Bearer realm="gsc-connect"'
    );
  }

  const token = authHeader.slice(7);
  if (!token) {
    throw new McpAuthError("Bearer token is empty", 401, 'Bearer realm="gsc-connect"');
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  // Path 1: OAuth token (Claude.ai / ChatGPT)
  const oauthToken = await db.oAuthToken.findFirst({
    where: { accessTokenHash: tokenHash, expiresAt: { gt: new Date() } },
    include: { property: true },
  });

  if (oauthToken) {
    let source = "OAuth Client";
    try {
      const client = await db.oAuthClient.findFirst({
        where: { clientId: oauthToken.clientId },
        select: { clientName: true },
      });
      if (client?.clientName && client.clientName !== "Unknown") {
        source = client.clientName;
      } else {
        source = oauthToken.clientId.slice(0, 8);
      }
    } catch {
      // non-critical - keep default source
    }

    const usageCheck = await checkAndIncrementUsage(oauthToken.userId);
    if (!usageCheck.allowed) {
      throw new McpAuthError(usageCheck.reason ?? "Monthly tool call limit reached", 429);
    }

    return {
      userId: oauthToken.userId,
      propertyId: oauthToken.propertyId,
      siteUrl: oauthToken.property.siteUrl,
      scopes: oauthToken.scopes,
      source,
    };
  }

  // Path 2: API key (Claude Desktop / Cursor)
  const apiKey = await db.apiKey.findFirst({
    where: { keyHash: tokenHash, isActive: true },
  });

  if (apiKey) {
    db.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch((err: unknown) => console.error("[mcp-auth] Failed to update api key lastUsedAt:", err));

    const property = await db.gscProperty.findFirst({
      where: { userId: apiKey.userId, isActive: true },
    });

    if (!property) {
      throw new McpAuthError(
        "No active GSC property found. Connect a property in the dashboard first.",
        403
      );
    }

    const usageCheck = await checkAndIncrementUsage(apiKey.userId);
    if (!usageCheck.allowed) {
      throw new McpAuthError(usageCheck.reason ?? "Monthly tool call limit reached", 429);
    }

    return {
      userId: apiKey.userId,
      propertyId: property.id,
      siteUrl: property.siteUrl,
      scopes: "gsc:read",
      source: apiKey.name || "API Key",
    };
  }

  throw new McpAuthError("Invalid or expired token", 401, 'Bearer realm="gsc-connect"');
}

export { McpAuthError };
