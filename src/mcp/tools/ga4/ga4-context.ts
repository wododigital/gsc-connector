/**
 * GA4 tool context helper
 *
 * Mirrors gsc-client.ts but for GA4 properties.
 * Gets the user's Google credential (access token) and resolves a GA4 property.
 */

import db from "../../../lib/db.js";
import { decrypt } from "../../../lib/encryption.js";
import { refreshCredentialAccessToken } from "../../../lib/google-refresh.js";
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
  // Prefer the credential whose consent includes the GA4 scope; recency
  // alone can pick a credential whose refresh token lacks it (see the
  // matching comment in src/lib/gbp/access.ts).
  const credentials = await db.googleCredential.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      userId: true,
      googleEmail: true,
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
      tokenExpiry: true,
      scopes: true,
    },
  });

  const credential =
    credentials.find((c) => c.scopes.includes("analytics.readonly")) ??
    credentials[0];

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

  // Token expired - refresh via the shared helper (marks credential health
  // + alerts admin on permanent failure, updates only this credential row).
  return refreshCredentialAccessToken(credential);
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
