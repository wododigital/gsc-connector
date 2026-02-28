/**
 * Google OAuth Callback - GSC Connection
 * GET /api/gsc/callback
 *
 * Handles the callback for connecting a GSC account (not platform login).
 * 1. Validates state cookie (CSRF protection)
 * 2. Exchanges code for tokens (including refresh_token)
 * 3. Encrypts refresh_token and access_token before storage
 * 4. Creates or updates google_credentials in DB
 * 5. Fetches list of GSC properties from Google API
 * 6. Upserts each property in gsc_properties table
 * 7. Redirects to /dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, getGoogleUserInfo } from "@/lib/google-oauth";
import { listSites } from "@/lib/google-api";
import { encrypt } from "@/lib/encryption";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { config } from "@/config/index";
import type { SiteEntry } from "@/types/index";

const GSC_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/webmasters.readonly",
].join(" ");

export async function GET(req: NextRequest) {
  try {
    // Must be logged in as a platform user
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", config.app.url));
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=google_denied`, config.app.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=missing_code`, config.app.url)
      );
    }

    // Validate CSRF state cookie
    const cookieState = req.cookies.get("gsc_oauth_state")?.value;
    if (!cookieState || cookieState !== state) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=state_mismatch`, config.app.url)
      );
    }

    const gscCallbackUri = `${config.app.url}/api/gsc/callback`;
    const tokens = await exchangeGoogleCode(code, gscCallbackUri);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=token_exchange_failed`, config.app.url)
      );
    }

    if (!tokens.refresh_token) {
      // Without a refresh token we cannot maintain long-term access.
      // This can happen if the user previously granted access. Force a re-consent
      // by using prompt=consent in buildGoogleAuthUrl (already set).
      return NextResponse.redirect(
        new URL(`/dashboard?error=no_refresh_token`, config.app.url)
      );
    }

    // Get the Google user profile for this credential
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Encrypt tokens at rest - never store plaintext
    const accessTokenEncrypted = encrypt(tokens.access_token);
    const refreshTokenEncrypted = encrypt(tokens.refresh_token);

    // Find existing credential for this Google account
    const existingCredential = await db.googleCredential.findFirst({
      where: { userId: session.id, googleEmail: userInfo.email },
      select: { id: true },
    });

    let credentialId: string;

    if (existingCredential) {
      // Update existing credential
      await db.googleCredential.update({
        where: { id: existingCredential.id },
        data: {
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiry,
          scopes: GSC_SCOPES,
        },
      });
      credentialId = existingCredential.id;
    } else {
      // Create new credential record
      const newCredential = await db.googleCredential.create({
        data: {
          userId: session.id,
          googleEmail: userInfo.email,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiry,
          scopes: GSC_SCOPES,
        },
        select: { id: true },
      });
      credentialId = newCredential.id;
    }

    // Fetch the user's GSC properties from Google
    let siteEntries: SiteEntry[] = [];
    try {
      const sitesResponse = (await listSites(tokens.access_token)) as {
        siteEntry?: SiteEntry[];
      };
      siteEntries = sitesResponse.siteEntry ?? [];
    } catch (apiError) {
      console.error("[gsc/callback] Failed to fetch GSC sites:", apiError);
      // Not fatal - continue and redirect; user can refresh later
    }

    // Upsert each GSC property for this user
    for (const site of siteEntries) {
      try {
        await db.gscProperty.upsert({
          where: {
            userId_siteUrl: {
              userId: session.id,
              siteUrl: site.siteUrl,
            },
          },
          update: {
            permissionLevel: site.permissionLevel,
            credentialId,
            isActive: true,
          },
          create: {
            userId: session.id,
            credentialId,
            siteUrl: site.siteUrl,
            permissionLevel: site.permissionLevel,
            isActive: true,
          },
        });
      } catch (upsertError) {
        console.error(
          `[gsc/callback] Failed to upsert property ${site.siteUrl}:`,
          upsertError
        );
      }
    }

    // Clear the CSRF state cookie and redirect to dashboard
    const response = NextResponse.redirect(
      new URL("/dashboard?connected=true", config.app.url)
    );
    response.cookies.set("gsc_oauth_state", "", { maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    console.error("[gsc/callback] Unexpected error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=server_error", config.app.url)
    );
  }
}
