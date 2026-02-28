/**
 * MCP Auth Middleware
 * Validates Bearer tokens from the oauth_tokens and api_keys tables.
 * Owned by: Coder-MCP agent
 */

import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import db from "../../lib/db.js";
import { AppError } from "../../types/index.js";

// Extend Express Request to carry validated user context
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        propertyId: string;
        siteUrl: string;
        scopes: string;
      };
    }
  }
}

/**
 * Validate the Authorization: Bearer <token> header.
 * Checks oauth_tokens first (issued to Claude / ChatGPT via OAuth flow),
 * then falls back to api_keys (for Claude Desktop / Cursor direct API key auth).
 */
export async function validateAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res
        .status(401)
        .setHeader("WWW-Authenticate", 'Bearer realm="gsc-connect"')
        .json({ error: "Missing or invalid Authorization header" });
      return;
    }

    const token = authHeader.slice(7);
    if (!token) {
      res
        .status(401)
        .setHeader("WWW-Authenticate", 'Bearer realm="gsc-connect"')
        .json({ error: "Bearer token is empty" });
      return;
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    // ----------------------------------------------------------------
    // Path 1: OAuth token (issued to Claude.ai / ChatGPT via our OAuth provider)
    // ----------------------------------------------------------------
    const oauthToken = await db.oAuthToken.findFirst({
      where: {
        accessTokenHash: tokenHash,
        expiresAt: { gt: new Date() },
      },
      include: { property: true },
    });

    if (oauthToken) {
      req.user = {
        userId: oauthToken.userId,
        propertyId: oauthToken.propertyId,
        siteUrl: oauthToken.property.siteUrl,
        scopes: oauthToken.scopes,
      };
      next();
      return;
    }

    // ----------------------------------------------------------------
    // Path 2: API key (for Claude Desktop / Cursor direct auth)
    // ----------------------------------------------------------------
    const apiKey = await db.apiKey.findFirst({
      where: {
        keyHash: tokenHash,
        isActive: true,
      },
    });

    if (apiKey) {
      // Update last-used timestamp without blocking the request
      db.apiKey
        .update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        })
        .catch((err: unknown) => {
          console.error("[auth] Failed to update api key lastUsedAt:", err);
        });

      // Get the user's first active GSC property
      const property = await db.gscProperty.findFirst({
        where: { userId: apiKey.userId, isActive: true },
      });

      if (!property) {
        res.status(403).json({
          error:
            "No active GSC property found. Connect a property in the dashboard first.",
        });
        return;
      }

      req.user = {
        userId: apiKey.userId,
        propertyId: property.id,
        siteUrl: property.siteUrl,
        scopes: "gsc:read",
      };
      next();
      return;
    }

    res
      .status(401)
      .setHeader("WWW-Authenticate", 'Bearer realm="gsc-connect"')
      .json({ error: "Invalid or expired token" });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error("[auth] Unexpected error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}
