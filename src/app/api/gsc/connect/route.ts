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
      // Use a safe relative path instead of the full request URL
      return NextResponse.redirect(
        new URL("/auth/login?next=%2Fapi%2Fgsc%2Fconnect", config.app.url)
      );
    }

    const state = randomBytes(16).toString("hex");
    const gscCallbackUri = `${config.app.url}/api/gsc/callback`;

    // Optional return target so flows (onboarding wizard, OAuth consent page)
    // can pull users back to themselves after the Google round-trip.
    // Relative paths only, restricted to known prefixes - no open redirects.
    const url = new URL(req.url);
    const returnToParam = url.searchParams.get("return_to");
    let returnTarget = "/dashboard";
    if (url.searchParams.get("return") === "onboarding") {
      returnTarget = "/onboarding";
    } else if (
      returnToParam &&
      (returnToParam.startsWith("/onboarding") || returnToParam.startsWith("/oauth/consent")) &&
      !returnToParam.startsWith("//")
    ) {
      returnTarget = returnToParam;
    }

    const googleAuthUrl = buildGoogleAuthUrl({
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/business.manage",
      ],
      redirectUri: gscCallbackUri,
      state,
      accessType: "offline", // ensures we get a refresh_token
      // Pre-select the user's existing OMG account email so they cannot
      // accidentally connect a different Google account. The callback also
      // hard-rejects mismatches.
      loginHint: session.email,
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
    response.cookies.set("gsc_return_to", returnTarget, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
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
