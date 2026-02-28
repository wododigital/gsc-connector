/**
 * Google OAuth - Initiate platform login
 * GET /api/auth/google
 *
 * Redirects the user to Google OAuth with openid/email/profile scopes.
 * On success Google calls back to /api/auth/google/callback which
 * creates the user account and sets the session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildGoogleAuthUrl } from "@/lib/google-oauth";
import { config } from "@/config/index";

export async function GET(req: NextRequest) {
  try {
    const state = randomBytes(16).toString("hex");
    const loginCallbackUri = `${config.app.url}/api/auth/google/callback`;

    const googleAuthUrl = buildGoogleAuthUrl({
      scopes: ["openid", "email", "profile"],
      redirectUri: loginCallbackUri,
      state,
    });

    const response = NextResponse.redirect(googleAuthUrl);

    // Store state in a short-lived httpOnly cookie to prevent CSRF
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    // Optionally store the "next" param to redirect after login
    const next = new URL(req.url).searchParams.get("next");
    if (next) {
      response.cookies.set("oauth_next", next, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("[auth/google] Unexpected error:", error);
    return NextResponse.redirect(new URL("/auth/login?error=server_error", req.url));
  }
}
