/**
 * GBP access token helper - shared by MCP tools AND server components.
 *
 * Returns a fresh access token for the user's most-recently-updated Google
 * credential. Refreshes automatically if the stored token is within 5 minutes
 * of expiry, persisting the rotated token back to the DB.
 */

import db from "../db.js";
import { decrypt, encrypt } from "../encryption.js";
import { AppError } from "../../types/index.js";

export async function getGbpAccessToken(userId: string): Promise<string> {
  // Prefer the credential whose consent actually includes the GBP scope.
  // Picking by recency alone flapped: a GSC-side refresh bumps updatedAt and
  // can promote a credential whose refresh token lacks business.manage,
  // which then mints scope-less access tokens and 403s every GBP call.
  const credentials = await db.googleCredential.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
      tokenExpiry: true,
      scopes: true,
    },
  });

  const credential =
    credentials.find((c) => c.scopes.includes("business.manage")) ??
    // Legacy rows may have an empty scopes column; fall back to recency so
    // they keep working until the user reconnects.
    credentials[0];

  if (!credential) {
    throw new AppError(
      "NO_CREDENTIAL",
      "No Google account connected. Please connect your Google account from the dashboard.",
      401
    );
  }

  const now = new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000);
  if (credential.tokenExpiry > expiryBuffer) {
    return decrypt(credential.accessTokenEncrypted);
  }

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

  const data = (await res.json()) as { access_token: string; expires_in: number };
  // Update ONLY the credential we refreshed. updateMany({ userId }) used to
  // spray this token onto every credential row, corrupting rows whose
  // refresh tokens carry different scopes.
  await db.googleCredential.update({
    where: { id: credential.id },
    data: {
      accessTokenEncrypted: encrypt(data.access_token),
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}
