/**
 * Google OAuth Callback - Platform Login
 * GET /api/auth/google/callback
 *
 * Handles the Google OAuth callback for platform login (not GSC connection).
 * 1. Validates state cookie (CSRF protection)
 * 2. Exchanges code for tokens
 * 3. Gets user info from Google (sub, email, name)
 * 4. Upserts user in DB
 * 5. Creates session JWT, sets session cookie
 * 6. Redirects to /dashboard (or the stored "next" URL)
 */

import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, getGoogleUserInfo } from "@/lib/google-oauth";
import { createSessionToken, getSessionCookieOptions } from "@/lib/auth";
import db from "@/lib/db";
import { config } from "@/config/index";
import type { SessionUser } from "@/types/index";
import { provisionFreePlan } from "@/lib/usage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const googleError = searchParams.get("error");

  // User denied access at Google consent screen
  if (googleError) {
    console.warn(`[auth/google/callback] Google returned error: ${googleError}`);
    return NextResponse.redirect(
      new URL(`/auth/login?error=google_denied`, config.app.url)
    );
  }

  if (!code) {
    console.warn("[auth/google/callback] No authorization code in callback");
    return NextResponse.redirect(
      new URL(`/auth/login?error=missing_code`, config.app.url)
    );
  }

  // Validate state cookie (CSRF protection)
  const cookieState = req.cookies.get("oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    console.warn(
      `[auth/google/callback] State mismatch - cookie: ${cookieState ? "present" : "missing"}, param: ${state ? "present" : "missing"}`
    );
    return NextResponse.redirect(
      new URL(`/auth/login?error=state_mismatch`, config.app.url)
    );
  }

  // Exchange the authorization code for tokens
  const loginCallbackUri = `${config.app.url}/api/auth/google/callback`;
  console.log(`[auth/google/callback] Exchanging code - redirect_uri: ${loginCallbackUri}`);

  let tokens: { access_token: string; refresh_token?: string; expires_in: number };
  try {
    tokens = await exchangeGoogleCode(code, loginCallbackUri);
  } catch (err) {
    console.error("[auth/google/callback] Token exchange failed:", err);
    return NextResponse.redirect(
      new URL(`/auth/login?error=token_exchange_failed`, config.app.url)
    );
  }

  if (!tokens.access_token) {
    console.error("[auth/google/callback] Token exchange returned no access_token");
    return NextResponse.redirect(
      new URL(`/auth/login?error=token_exchange_failed`, config.app.url)
    );
  }

  // Get user profile from Google
  let userInfo: { sub: string; email: string; name: string };
  try {
    userInfo = await getGoogleUserInfo(tokens.access_token);
  } catch (err) {
    console.error("[auth/google/callback] Failed to fetch user info:", err);
    return NextResponse.redirect(
      new URL(`/auth/login?error=userinfo_failed`, config.app.url)
    );
  }

  if (!userInfo.email) {
    console.error("[auth/google/callback] Google user info missing email");
    return NextResponse.redirect(
      new URL(`/auth/login?error=missing_email`, config.app.url)
    );
  }

  // Upsert user in the database
  let user: { id: string; email: string; name: string | null; subscriptionTier: string };
  try {
    user = await db.user.upsert({
      where: { email: userInfo.email },
      update: {
        name: userInfo.name ?? null,
        googleId: userInfo.sub,
      },
      create: {
        email: userInfo.email,
        name: userInfo.name ?? null,
        googleId: userInfo.sub,
        subscriptionTier: "free",
      },
    });
  } catch (err) {
    console.error("[auth/google/callback] Database upsert failed:", err);
    return NextResponse.redirect(
      new URL(`/auth/login?error=db_error`, config.app.url)
    );
  }

  // Auto-provision free plan for new users (no-op if subscription already exists)
  try {
    await provisionFreePlan(user.id);
  } catch (err) {
    // Non-fatal - user can still sign in without a plan record
    console.error("[auth/google/callback] provisionFreePlan failed (non-fatal):", err);
  }

  // Create session JWT
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    subscriptionTier: user.subscriptionTier as "free" | "pro" | "agency",
  };

  let sessionToken: string;
  try {
    sessionToken = await createSessionToken(sessionUser);
  } catch (err) {
    console.error("[auth/google/callback] Session token creation failed:", err);
    return NextResponse.redirect(
      new URL(`/auth/login?error=session_error`, config.app.url)
    );
  }

  const cookieOptions = getSessionCookieOptions();

  // Determine where to redirect after login
  const nextUrl = req.cookies.get("oauth_next")?.value ?? "/dashboard";
  const response = NextResponse.redirect(new URL(nextUrl, config.app.url));

  // Set session cookie
  response.cookies.set(cookieOptions.name, sessionToken, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    maxAge: cookieOptions.maxAge,
    path: cookieOptions.path,
  });

  // Clear the short-lived state and next cookies
  response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
  response.cookies.set("oauth_next", "", { maxAge: 0, path: "/" });

  console.log(`[auth/google/callback] Sign-in successful for ${userInfo.email}`);
  return response;
}
