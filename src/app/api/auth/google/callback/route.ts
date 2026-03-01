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
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // User denied access
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=google_denied`, config.app.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=missing_code`, config.app.url)
      );
    }

    // Validate state cookie (CSRF protection)
    const cookieState = req.cookies.get("oauth_state")?.value;
    if (!cookieState || cookieState !== state) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=state_mismatch`, config.app.url)
      );
    }

    // Exchange the authorization code for tokens
    const loginCallbackUri = `${config.app.url}/api/auth/google/callback`;
    const tokens = await exchangeGoogleCode(code, loginCallbackUri);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=token_exchange_failed`, config.app.url)
      );
    }

    // Get user profile from Google
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    if (!userInfo.email) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=missing_email`, config.app.url)
      );
    }

    // Upsert user in the database
    const user = await db.user.upsert({
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

    // Auto-provision free plan for new users (no-op if subscription already exists)
    await provisionFreePlan(user.id);

    // Create session JWT
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier as "free" | "pro" | "agency",
    };

    const sessionToken = await createSessionToken(sessionUser);
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

    return response;
  } catch (error) {
    console.error("[auth/google/callback] Unexpected error:", error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=server_error`, config.app.url)
    );
  }
}
