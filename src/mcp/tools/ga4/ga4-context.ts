/**
 * GA4 tool context helper
 *
 * Mirrors gsc-client.ts but for GA4 properties.
 * Gets the user's Google credential (access token) and resolves a GA4 property.
 */

import db from "../../../lib/db.js";
import { decrypt } from "../../../lib/encryption.js";
import { AppError } from "../../../types/index.js";
import { resolveGA4Property } from "../../../lib/ga4/resolve-property.js";

interface GA4Context {
  accessToken: string;
  propertyId: string; // "properties/987654321"
  displayName: string;
  userId: string;
}

/**
 * Get the access token for the user's first active Google credential.
 * Tries to refresh if the token is expired.
 */
async function getAccessToken(userId: string): Promise<string> {
  const credential = await db.googleCredential.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
      tokenExpiry: true,
    },
  });

  if (!credential) {
    throw new AppError(
      "NO_CREDENTIAL",
      "No Google account connected. Please connect your Google account from the dashboard.",
      401
    );
  }

  const now = new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000); // 5 min buffer

  if (credential.tokenExpiry > expiryBuffer) {
    // Token is still valid
    return decrypt(credential.accessTokenEncrypted);
  }

  // Token expired - refresh it
  const refreshToken = decrypt(credential.refreshTokenEncrypted);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    throw new AppError(
      "TOKEN_REFRESH_FAILED",
      "Failed to refresh Google credentials. Please reconnect your Google account.",
      401
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  // Update the stored token
  const { encrypt } = await import("../../../lib/encryption.js");
  await db.googleCredential.updateMany({
    where: { userId },
    data: {
      accessTokenEncrypted: encrypt(data.access_token),
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

/**
 * Get GA4 context by resolving property_id input.
 * If input is falsy, uses the user's first active GA4 property.
 */
export async function getGA4Context(
  userId: string,
  propertyInput: string
): Promise<GA4Context> {
  const accessToken = await getAccessToken(userId);

  if (!propertyInput) {
    // No property specified - use first active property
    const first = await db.ga4Property.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { propertyId: true, displayName: true },
    });

    if (!first) {
      throw new AppError(
        "NO_GA4_PROPERTY",
        "No active GA4 properties found. Please connect your Google account and select GA4 properties.",
        404
      );
    }

    return {
      accessToken,
      propertyId: first.propertyId,
      displayName: first.displayName,
      userId,
    };
  }

  const result = await resolveGA4Property(propertyInput, userId);

  if ("notFound" in result) {
    throw new AppError("GA4_PROPERTY_NOT_FOUND", result.message, 404);
  }

  return {
    accessToken,
    propertyId: result.resolved.propertyId,
    displayName: result.resolved.displayName,
    userId,
  };
}
