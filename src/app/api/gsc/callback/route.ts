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
import { listGA4Properties } from "@/lib/ga4/api";
import { encrypt } from "@/lib/encryption";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { config } from "@/config/index";
import type { SiteEntry } from "@/types/index";

export async function GET(req: NextRequest) {
  // Must be logged in as a platform user
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", config.app.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const googleError = searchParams.get("error");

  if (googleError) {
    console.warn(`[gsc/callback] Google returned error: ${googleError}`);
    return NextResponse.redirect(
      new URL(`/dashboard?error=google_denied`, config.app.url)
    );
  }

  if (!code) {
    console.warn("[gsc/callback] No authorization code in callback");
    return NextResponse.redirect(
      new URL(`/dashboard?error=missing_code`, config.app.url)
    );
  }

  // Validate CSRF state cookie
  const cookieState = req.cookies.get("gsc_oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    console.warn(
      `[gsc/callback] State mismatch - cookie: ${cookieState ? "present" : "missing"}, param: ${state ? "present" : "missing"}`
    );
    return NextResponse.redirect(
      new URL(`/dashboard?error=state_mismatch`, config.app.url)
    );
  }

  // Exchange code for tokens
  const gscCallbackUri = `${config.app.url}/api/gsc/callback`;
  console.log(`[gsc/callback] Exchanging code - redirect_uri: ${gscCallbackUri}`);

  let tokens: { access_token: string; refresh_token?: string; expires_in: number; scope?: string };
  try {
    tokens = await exchangeGoogleCode(code, gscCallbackUri);
  } catch (err) {
    console.error("[gsc/callback] Token exchange failed:", err);
    return NextResponse.redirect(
      new URL(`/dashboard?error=token_exchange_failed`, config.app.url)
    );
  }

  if (!tokens.access_token) {
    console.error("[gsc/callback] Token exchange returned no access_token");
    return NextResponse.redirect(
      new URL(`/dashboard?error=token_exchange_failed`, config.app.url)
    );
  }

  if (!tokens.refresh_token) {
    // Without a refresh token we cannot maintain long-term access.
    // This can happen if the user previously granted access. Force a re-consent
    // by using prompt=consent in buildGoogleAuthUrl (already set).
    console.warn("[gsc/callback] No refresh_token returned - user may need to revoke and reconnect");
    return NextResponse.redirect(
      new URL(`/dashboard?error=no_refresh_token`, config.app.url)
    );
  }

  // Get the Google user profile for this credential
  let userInfo: { email: string };
  try {
    userInfo = await getGoogleUserInfo(tokens.access_token);
  } catch (err) {
    console.error("[gsc/callback] Failed to fetch user info:", err);
    return NextResponse.redirect(
      new URL(`/dashboard?error=userinfo_failed`, config.app.url)
    );
  }

  // Account lock: the connected Google account MUST match the OMG account.
  // Users cannot connect a different Google account from the one they
  // signed in with; if they need a different Google identity they should
  // create a separate OMG account.
  if (userInfo.email.toLowerCase() !== session.email.toLowerCase()) {
    console.warn(
      `[gsc/callback] Account mismatch: session=${session.email} google=${userInfo.email}`
    );
    const wrong = encodeURIComponent(userInfo.email);
    return NextResponse.redirect(
      new URL(`/dashboard?error=wrong_google_account&attempted=${wrong}`, config.app.url)
    );
  }

  // Calculate token expiry
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

  // Encrypt tokens at rest - never store plaintext
  const accessTokenEncrypted = encrypt(tokens.access_token);
  const refreshTokenEncrypted = encrypt(tokens.refresh_token);

  // Record the scopes Google actually granted (not just what we asked for).
  // If Google omits the scope echo we fall back to the BASIC scopes only -
  // never analytics/business.manage. Over-claiming here made the dashboard
  // show GBP as connected while every GBP API call 403ed.
  const BASIC_FALLBACK_SCOPES =
    "openid email profile https://www.googleapis.com/auth/webmasters.readonly";
  let grantedScopes: string;
  if (tokens.scope && tokens.scope.length > 0) {
    grantedScopes = tokens.scope;
  } else {
    console.warn(
      "[gsc/callback] Google did not echo granted scopes; recording basic scopes only"
    );
    grantedScopes = BASIC_FALLBACK_SCOPES;
  }

  // Persist credential to DB
  let credentialId: string;
  try {
    const existingCredential = await db.googleCredential.findFirst({
      where: { userId: session.id, googleEmail: userInfo.email },
      select: { id: true },
    });

    if (existingCredential) {
      await db.googleCredential.update({
        where: { id: existingCredential.id },
        data: { accessTokenEncrypted, refreshTokenEncrypted, tokenExpiry, scopes: grantedScopes },
      });
      credentialId = existingCredential.id;
    } else {
      const newCredential = await db.googleCredential.create({
        data: {
          userId: session.id,
          googleEmail: userInfo.email,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiry,
          scopes: grantedScopes,
        },
        select: { id: true },
      });
      credentialId = newCredential.id;
    }
  } catch (err) {
    console.error("[gsc/callback] Failed to save credential to DB:", err);
    return NextResponse.redirect(
      new URL(`/dashboard?error=db_error`, config.app.url)
    );
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
        where: { userId_siteUrl: { userId: session.id, siteUrl: site.siteUrl } },
        update: {
          permissionLevel: site.permissionLevel,
          credentialId,
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
      console.error(`[gsc/callback] Failed to upsert property ${site.siteUrl}:`, upsertError);
    }
  }

  // Fetch and save GA4 properties - non-fatal if analytics scope not granted
  try {
    const ga4Props = await listGA4Properties(tokens.access_token);
    for (const prop of ga4Props) {
      try {
        await db.ga4Property.upsert({
          where: { userId_propertyId: { userId: session.id, propertyId: prop.property } },
          update: {
            displayName: prop.displayName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            accountName: (prop as any).accountName ?? null,
            credentialId,
          },
          create: {
            userId: session.id,
            credentialId,
            propertyId: prop.property,
            displayName: prop.displayName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            accountName: (prop as any).accountName ?? null,
            isActive: true,
          },
        });
      } catch (upsertErr) {
        console.error(`[gsc/callback] Failed to upsert GA4 property ${prop.property}:`, upsertErr);
      }
    }
  } catch (ga4Error) {
    console.warn(
      "[gsc/callback] Could not fetch GA4 properties (analytics scope may not be granted):",
      ga4Error instanceof Error ? ga4Error.message : ga4Error
    );
  }

  console.log(`[gsc/callback] GSC connected successfully for user ${session.id}`);

  // Honour the gsc_return_to cookie set by /api/gsc/connect so the onboarding
  // wizard can pull users back to itself instead of bouncing through /dashboard.
  const returnTo = req.cookies.get("gsc_return_to")?.value;
  const safeReturn = returnTo === "/onboarding" ? "/onboarding?connected=true" : "/dashboard?connected=true";
  const response = NextResponse.redirect(new URL(safeReturn, config.app.url));
  response.cookies.set("gsc_oauth_state", "", { maxAge: 0, path: "/" });
  response.cookies.set("gsc_return_to", "", { maxAge: 0, path: "/" });
  return response;
}
