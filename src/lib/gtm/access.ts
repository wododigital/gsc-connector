/**
 * GTM access token helper - mirrors src/lib/gbp/access.ts.
 * Prefers the credential whose recorded scopes include tagmanager access.
 */

import db from "../db.js";
import { decrypt } from "../encryption.js";
import { refreshCredentialAccessToken } from "../google-refresh.js";
import { AppError } from "../../types/index.js";

export async function getGtmAccessToken(userId: string): Promise<string> {
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

  const credential = credentials.find((c) => c.scopes.includes("tagmanager"));

  if (!credential) {
    throw new AppError(
      "NO_CREDENTIAL",
      "Tag Manager is not connected. Go to the dashboard and click Connect on the Tag Manager card.",
      401
    );
  }

  const expiryBuffer = new Date(Date.now() + 5 * 60 * 1000);
  if (credential.tokenExpiry > expiryBuffer) {
    return decrypt(credential.accessTokenEncrypted);
  }

  return refreshCredentialAccessToken(credential);
}
