/**
 * GBP tool context helper
 *
 * Mirrors ga4-context.ts but for Google Business Profile.
 * Only provides an access token - GBP doesn't have stored "properties"
 * in the DB; accounts/locations are fetched live from the API.
 */

import db from "../../../lib/db.js";
import { decrypt } from "../../../lib/encryption.js";
import { AppError } from "../../../types/index.js";

/**
 * Get the access token for the user's active Google credential.
 * Refreshes automatically if expired.
 */
export async function getGbpAccessToken(userId: string): Promise<string> {
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
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000); // 5-minute buffer

  if (credential.tokenExpiry > expiryBuffer) {
    return decrypt(credential.accessTokenEncrypted);
  }

  // Refresh expired token
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
