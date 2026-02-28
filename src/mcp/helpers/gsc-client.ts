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

export interface GscContext {
  accessToken: string;
  siteUrl: string;
  userId: string;
}

/**
 * Returns a GscContext (accessToken + siteUrl) for the given user/property pair.
 * Refreshes the access token if it is within 5 minutes of expiry.
 *
 * @throws AppError("PROPERTY_NOT_FOUND") if the property does not exist
 * @throws AppError("FORBIDDEN") if the property does not belong to this user
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

    const credential = property.credential;

    // Use the access token if it is valid for at least 5 more minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

    if (credential.tokenExpiry > fiveMinutesFromNow) {
      return {
        accessToken: decrypt(credential.accessTokenEncrypted),
        siteUrl: property.siteUrl,
        userId,
      };
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

    return {
      accessToken: newTokens.access_token,
      siteUrl: property.siteUrl,
      userId,
    };
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
