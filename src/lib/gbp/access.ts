/**
 * GBP access token helper - shared by MCP tools AND server components.
 *
 * Returns a fresh access token for the user's most-recently-updated Google
 * credential. Refreshes automatically if the stored token is within 5 minutes
 * of expiry, persisting the rotated token back to the DB.
 */

import db from "../db.js";
import { decrypt } from "../encryption.js";
import { refreshCredentialAccessToken } from "../google-refresh.js";
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
      userId: true,
      googleEmail: true,
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

  // Refresh via the shared helper (marks credential health + alerts admin
  // on permanent failure, updates only this credential row).
  return refreshCredentialAccessToken(credential);
}
