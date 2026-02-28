/**
 * Initiate Google OAuth for GSC Connection
 * GET /api/gsc/connect
 *
 * Different from platform login - adds webmasters.readonly scope.
 * The user must already be logged in (have a session) to connect GSC.
 * On success Google calls back to /api/gsc/callback.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildGoogleAuthUrl } from "@/lib/google-oauth";
import { getSession } from "@/lib/auth";
import { config } from "@/config/index";

export async function GET(req: NextRequest) {
  try {
    // User must already be authenticated on the platform
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(
        new URL(`/auth/login?next=${encodeURIComponent(req.url)}`, config.app.url)
      );
    }

    const state = randomBytes(16).toString("hex");
    const gscCallbackUri = `${config.app.url}/api/gsc/callback`;

    const googleAuthUrl = buildGoogleAuthUrl({
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/webmasters.readonly",
      ],
      redirectUri: gscCallbackUri,
      state,
      accessType: "offline", // ensures we get a refresh_token
    });

    const response = NextResponse.redirect(googleAuthUrl);

    // CSRF state cookie
    response.cookies.set("gsc_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[gsc/connect] Unexpected error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=server_error", config.app.url)
    );
  }
}
