/**
 * GSC Client Helper
 * Retrieves a valid Google access token for a given userId + propertyId.
 * Automatically refreshes expired tokens and persists the new token to the DB.
 * Owned by: Coder-MCP agent
 */

import db from "../../lib/db.js";
import { decrypt, encrypt } from "../../lib/encryption.js";
import { refreshGoogleToken } from "../../lib/google-api.js";
import { AppError } from "../../types/index.js";
import { resolveSiteUrl } from "../../lib/resolve-site-url.js";

export interface GscContext {
  accessToken: string;
  siteUrl: string;
  userId: string;
}

/** Shared token refresh logic for a credential record */
async function resolveAccessToken(credential: {
  id: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiry: Date;
}): Promise<string> {
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (credential.tokenExpiry > fiveMinutesFromNow) {
    return decrypt(credential.accessTokenEncrypted);
  }

  // Token is expired or about to expire - refresh it
  const refreshToken = decrypt(credential.refreshTokenEncrypted);
  const newTokens = await refreshGoogleToken(refreshToken);

  const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000);
  const newAccessTokenEncrypted = encrypt(newTokens.access_token);

  await db.googleCredential.update({
    where: { id: credential.id },
    data: {
      accessTokenEncrypted: newAccessTokenEncrypted,
      tokenExpiry: newExpiry,
    },
  });

  return newTokens.access_token;
}

/**
 * Returns a GscContext (accessToken + siteUrl) for the given user/property pair.
 * Refreshes the access token if it is within 5 minutes of expiry.
 * Verifies the property is isActive=true before allowing access.
 *
 * @throws AppError("PROPERTY_NOT_FOUND") if the property does not exist
 * @throws AppError("FORBIDDEN") if the property does not belong to this user
 * @throws AppError("PROPERTY_NOT_ACTIVE") if the property is not in the user's active selection
 * @throws AppError("CREDENTIAL_NOT_FOUND") on any token refresh failure
 */
export async function getGscContext(
  userId: string,
  propertyId: string
): Promise<GscContext> {
  try {
    const property = await db.gscProperty.findUnique({
      where: { id: propertyId },
      include: { credential: true },
    });

    if (!property) {
      throw new AppError("PROPERTY_NOT_FOUND", "GSC property not found", 404);
    }

    if (property.userId !== userId) {
      throw new AppError("FORBIDDEN", "Access denied to this property", 403);
    }

    if (!property.isActive) {
      // The default property is inactive - guide the user to pick an active one
      const activeProps = await db.gscProperty.findMany({
        where: { userId, isActive: true },
        select: { siteUrl: true },
        orderBy: { createdAt: "asc" },
      });
      const propList =
        activeProps.length > 0
          ? activeProps.map((p) => p.siteUrl).join(", ")
          : "none";
      throw new AppError(
        "PROPERTY_NOT_ACTIVE",
        `This property is not in your active selection. Use list_my_properties to see your active properties. Active properties: ${propList}`,
        403
      );
    }

    const accessToken = await resolveAccessToken(property.credential);

    return { accessToken, siteUrl: property.siteUrl, userId };
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error("[gsc-client] Unexpected error:", error);
    throw new AppError(
      "CREDENTIAL_NOT_FOUND",
      "Failed to get GSC access. Please reconnect your Google account.",
      401
    );
  }
}

/**
 * Returns a GscContext for a property identified by siteUrl (instead of propertyId).
 * Used when a tool call specifies site_url to override the default property.
 * Only allows active properties (isActive=true).
 *
 * @throws AppError("PROPERTY_NOT_FOUND") if no active property matches siteUrl
 * @throws AppError("CREDENTIAL_NOT_FOUND") on token refresh failure
 */
export async function getGscContextBySiteUrl(
  userId: string,
  input: string
): Promise<GscContext> {
  try {
    // Get all active properties and fuzzy-match the input
    const activeProperties = await db.gscProperty.findMany({
      where: { userId, isActive: true },
      select: { siteUrl: true },
    });

    const resolved = resolveSiteUrl(input, activeProperties);

    if ("ambiguous" in resolved) {
      throw new AppError("PROPERTY_NOT_FOUND", resolved.message, 400);
    }

    if ("notFound" in resolved) {
      // Check if the input matches an inactive property for a better error
      const inactiveProperties = await db.gscProperty.findMany({
        where: { userId, isActive: false },
        select: { siteUrl: true },
      });
      const inactiveMatch = resolveSiteUrl(input, inactiveProperties);
      if ("resolved" in inactiveMatch) {
        throw new AppError(
          "PROPERTY_NOT_ACTIVE",
          `This property is not in your active selection. Use list_my_properties to see your active properties.`,
          403
        );
      }
      throw new AppError("PROPERTY_NOT_FOUND", resolved.message, 404);
    }

    const property = await db.gscProperty.findFirst({
      where: { userId, siteUrl: resolved.resolved, isActive: true },
      include: { credential: true },
    });

    if (!property) {
      throw new AppError(
        "PROPERTY_NOT_FOUND",
        `Property not found. Use list_my_properties to see available properties.`,
        404
      );
    }

    const accessToken = await resolveAccessToken(property.credential);

    return { accessToken, siteUrl: property.siteUrl, userId };
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error("[gsc-client] Unexpected error:", error);
    throw new AppError(
      "CREDENTIAL_NOT_FOUND",
      "Failed to get GSC access. Please reconnect your Google account.",
      401
    );
  }
}
