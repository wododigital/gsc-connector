/**
 * Initiate incremental Google OAuth for a gated platform (GTM / Google Ads).
 * GET /api/platform/connect?platform=gtm|google_ads
 *
 * Entitlement-gated: only users granted access in /admin/users may connect.
 * Uses include_granted_scopes so the new consent ADDS the platform scopes to
 * the user's existing grant (GSC/GA4/GBP remain intact) and the resulting
 * refresh token carries the cumulative scope set. Reuses /api/gsc/callback,
 * which records the granted scopes on the credential row.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildGoogleAuthUrl } from "@/lib/google-oauth";
import { getSession } from "@/lib/auth";
import { hasPlatformAccess, isGatedPlatform } from "@/lib/platform-access";
import { config } from "@/config/index";

const PLATFORM_SCOPES: Record<string, string[]> = {
  gtm: [
    "https://www.googleapis.com/auth/tagmanager.readonly",
    "https://www.googleapis.com/auth/tagmanager.edit.containers",
    "https://www.googleapis.com/auth/tagmanager.publish",
  ],
  google_ads: ["https://www.googleapis.com/auth/adwords"],
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(
        new URL("/auth/login?next=%2Fdashboard", config.app.url)
      );
    }

    const reqUrl = new URL(req.url);
    const platform = reqUrl.searchParams.get("platform") ?? "";
    if (!isGatedPlatform(platform)) {
      return NextResponse.redirect(
        new URL("/dashboard?error=unknown_platform", config.app.url)
      );
    }

    const entitled = await hasPlatformAccess(session.id, platform);
    if (!entitled) {
      return NextResponse.redirect(
        new URL("/dashboard?error=platform_not_enabled", config.app.url)
      );
    }

    const state = randomBytes(16).toString("hex");
    const callbackUri = `${config.app.url}/api/gsc/callback`;

    const googleAuthUrl = buildGoogleAuthUrl({
      // Base identity scopes + the platform's scopes; include_granted_scopes
      // merges everything the user previously granted.
      scopes: ["openid", "email", "profile", ...PLATFORM_SCOPES[platform]],
      redirectUri: callbackUri,
      state,
      accessType: "offline",
      includeGrantedScopes: true,
      loginHint: session.email,
    });

    const response = NextResponse.redirect(googleAuthUrl);
    response.cookies.set("gsc_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
    // Optional relative return target (e.g. back to the OAuth consent page)
    const returnToParam = reqUrl.searchParams.get("return_to");
    const returnTarget =
      returnToParam &&
      (returnToParam.startsWith("/onboarding") || returnToParam.startsWith("/oauth/consent")) &&
      !returnToParam.startsWith("//")
        ? returnToParam
        : "/dashboard";
    response.cookies.set("gsc_return_to", returnTarget, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("[platform/connect] Unexpected error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=server_error", config.app.url)
    );
  }
}
