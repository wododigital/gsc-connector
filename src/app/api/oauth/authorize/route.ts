/**
 * OAuth2 Authorization Endpoint
 *
 * GET  /api/oauth/authorize - Validate params and redirect to consent UI page
 * POST /api/oauth/authorize - Called by consent page: generate code or deny
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { config } from "@/config/index";

// ----------------------------------------------------------------
// GET - Redirect browser to consent UI
// ----------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const response_type = searchParams.get("response_type");
    const client_id = searchParams.get("client_id");
    const redirect_uri = searchParams.get("redirect_uri");
    const state = searchParams.get("state") ?? "";
    const code_challenge = searchParams.get("code_challenge") ?? "";
    const code_challenge_method = searchParams.get("code_challenge_method") ?? "";
    const scope = searchParams.get("scope") ?? "gsc:read";

    if (response_type !== "code") {
      return NextResponse.json(
        { error: "unsupported_response_type" },
        { status: 400 }
      );
    }

    if (!client_id) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "client_id is required" },
        { status: 400 }
      );
    }

    if (!redirect_uri) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "redirect_uri is required" },
        { status: 400 }
      );
    }

    // Validate client exists and redirect_uri is registered
    const client = await db.oAuthClient.findUnique({
      where: { clientId: client_id },
    });

    if (!client) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Unknown client_id" },
        { status: 400 }
      );
    }

    if (!client.redirectUris.includes(redirect_uri)) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "redirect_uri does not match registered URIs",
        },
        { status: 400 }
      );
    }

    // If user is not logged in, redirect to login page first, then back here
    const session = await getSession();
    if (!session) {
      const loginUrl = new URL(`${config.app.url}/auth/login`);
      loginUrl.searchParams.set("next", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect to the consent page UI (a Next.js page, not an API route)
    const consentUrl = new URL(`${config.app.url}/oauth/consent`);
    consentUrl.searchParams.set("client_id", client_id);
    consentUrl.searchParams.set("redirect_uri", redirect_uri);
    consentUrl.searchParams.set("state", state);
    consentUrl.searchParams.set("code_challenge", code_challenge);
    consentUrl.searchParams.set("code_challenge_method", code_challenge_method);
    consentUrl.searchParams.set("scope", scope);

    return NextResponse.redirect(consentUrl);
  } catch (error) {
    console.error("[oauth/authorize GET] Unexpected error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// ----------------------------------------------------------------
// POST - Generate auth code (called by the consent page form)
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // The consent page is a browser HTML form - it POSTs as application/x-www-form-urlencoded.
    // Also accept JSON for programmatic callers.
    let rawBody: Record<string, string>;
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      rawBody = Object.fromEntries(params.entries());
    } else {
      try {
        rawBody = (await req.json()) as Record<string, string>;
      } catch {
        return NextResponse.json(
          { error: "invalid_request", error_description: "Invalid request body" },
          { status: 400 }
        );
      }
    }

    const {
      client_id,
      redirect_uri,
      state,
      code_challenge,
      code_challenge_method,
      property_id,
      action,
    } = rawBody;

    if (!client_id || !redirect_uri) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "client_id and redirect_uri are required" },
        { status: 400 }
      );
    }

    // Validate client and redirect_uri
    const client = await db.oAuthClient.findUnique({
      where: { clientId: client_id },
    });

    if (!client || !client.redirectUris.includes(redirect_uri)) {
      return NextResponse.json(
        { error: "invalid_client" },
        { status: 400 }
      );
    }

    const redirectUrl = new URL(redirect_uri);

    // Handle denial
    if (action === "deny") {
      redirectUrl.searchParams.set("error", "access_denied");
      if (state) redirectUrl.searchParams.set("state", state);
      // 302 converts the browser's POST to a GET on the redirect_uri
      return NextResponse.redirect(redirectUrl.toString(), 302);
    }

    // Approval - validate property selection
    if (!property_id) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "property_id is required when approving authorization",
        },
        { status: 400 }
      );
    }

    // Verify property belongs to the authenticated user
    const property = await db.gscProperty.findFirst({
      where: { id: property_id, userId: session.id, isActive: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Property not found or not active" },
        { status: 400 }
      );
    }

    // Generate a cryptographically random authorization code
    const code = randomBytes(32).toString("hex");
    const codeHash = createHash("sha256").update(code).digest("hex");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.oAuthAuthorizationCode.create({
      data: {
        codeHash,
        userId: session.id,
        clientId: client_id,
        redirectUri: redirect_uri,
        propertyId: property_id,
        codeChallenge: code_challenge ?? null,
        codeChallengeMethod: code_challenge_method ?? null,
        scopes: "gsc:read",
        expiresAt,
        used: false,
      },
    });

    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);

    // 302 converts the browser's POST to a GET on the redirect_uri (required by OAuth spec)
    return NextResponse.redirect(redirectUrl.toString(), 302);
  } catch (error) {
    console.error("[oauth/authorize POST] Unexpected error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
