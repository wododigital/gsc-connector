/**
 * Shared Google credential refresh with health tracking.
 *
 * Used by the GSC, GA4 and GBP token helpers. On refresh:
 * - success: persists the new access token to the refreshed row only,
 *   stamps lastRefreshAt and resets status to "active".
 * - invalid_grant (consent revoked / refresh token dead): marks the
 *   credential status="needs_reauth", records the error, and fires a
 *   deduplicated admin alert. This is a permanent failure - the user
 *   must reconnect.
 * - anything else (network, Google 5xx, rate limit): treated as transient;
 *   the credential is NOT marked broken and no alert fires.
 */

import db from "./db.js";
import { decrypt, encrypt } from "./encryption.js";
import { sendAdminAlert } from "./admin-alert.js";
import { AppError } from "../types/index.js";

export interface RefreshableCredential {
  id: string;
  userId: string;
  googleEmail?: string;
  refreshTokenEncrypted: string;
}

/**
 * Exchange the credential's refresh token for a fresh access token and
 * persist it. Throws AppError("TOKEN_REFRESH_FAILED") on permanent failure
 * and AppError("GOOGLE_UNAVAILABLE") on transient failure.
 */
export async function refreshCredentialAccessToken(
  credential: RefreshableCredential
): Promise<string> {
  const refreshToken = decrypt(credential.refreshTokenEncrypted);

  let res: Response;
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    });
  } catch (networkErr) {
    console.error("[google-refresh] Network error refreshing token:", networkErr);
    throw new AppError(
      "GOOGLE_UNAVAILABLE",
      "Could not reach Google to refresh credentials. Please try again in a moment.",
      503
    );
  }

  if (!res.ok) {
    const bodyText = await res.text();
    const isInvalidGrant = bodyText.includes("invalid_grant");

    if (isInvalidGrant) {
      // Permanent: consent was revoked or the refresh token expired.
      await db.googleCredential
        .update({
          where: { id: credential.id },
          data: {
            status: "needs_reauth",
            lastRefreshError: bodyText.slice(0, 500),
            lastRefreshAt: new Date(),
          },
        })
        .catch((e) => console.error("[google-refresh] Failed to mark credential:", e));

      await sendAdminAlert({
        type: "credential_refresh_failed",
        severity: "error",
        title: `Google connection dead for ${credential.googleEmail ?? credential.userId}`,
        message:
          `Google returned invalid_grant while refreshing the credential for ` +
          `${credential.googleEmail ?? "a user"} (user ${credential.userId}). ` +
          `Their GSC/GA4/GBP tools will fail until they reconnect their Google account.`,
        dedupeKey: credential.id,
        metadata: { credentialId: credential.id, userId: credential.userId },
      });

      throw new AppError(
        "TOKEN_REFRESH_FAILED",
        "Your Google connection has expired or been revoked. Please reconnect your Google account from the dashboard.",
        401
      );
    }

    // Transient (Google 5xx, rate limit, etc.) - do not mark the credential.
    console.error(
      `[google-refresh] Transient refresh failure (${res.status}):`,
      bodyText.slice(0, 300)
    );
    throw new AppError(
      "GOOGLE_UNAVAILABLE",
      "Google is temporarily unavailable. Please try again in a moment.",
      503
    );
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  await db.googleCredential.update({
    where: { id: credential.id },
    data: {
      accessTokenEncrypted: encrypt(data.access_token),
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      status: "active",
      lastRefreshError: null,
      lastRefreshAt: new Date(),
    },
  });

  return data.access_token;
}
