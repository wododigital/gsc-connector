/**
 * Google Ads access token helper - mirrors src/lib/gtm/access.ts.
 * Prefers the credential whose recorded scopes include auth/adwords.
 */

import db from "../db.js";
import { decrypt } from "../encryption.js";
import { refreshCredentialAccessToken } from "../google-refresh.js";
import { AppError } from "../../types/index.js";

export async function getAdsAccessToken(userId: string): Promise<string> {
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

  const credential = credentials.find((c) => c.scopes.includes("auth/adwords"));

  if (!credential) {
    throw new AppError(
      "NO_CREDENTIAL",
      "Google Ads is not connected. Go to the dashboard and click Connect on the Google Ads card.",
      401
    );
  }

  const expiryBuffer = new Date(Date.now() + 5 * 60 * 1000);
  if (credential.tokenExpiry > expiryBuffer) {
    return decrypt(credential.accessTokenEncrypted);
  }

  return refreshCredentialAccessToken(credential);
}
