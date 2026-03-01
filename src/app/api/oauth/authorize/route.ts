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

    // Parse body into a URLSearchParams so we can handle multi-value fields
    // (e.g. multiple property_id checkboxes) uniformly across form-encoded and JSON.
    const contentType = req.headers.get("content-type") ?? "";
    let bodyParams: URLSearchParams;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      bodyParams = new URLSearchParams(text);
    } else {
      // JSON body - convert to URLSearchParams
      let json: Record<string, unknown>;
      try {
        json = (await req.json()) as Record<string, unknown>;
      } catch {
        return NextResponse.json(
          { error: "invalid_request", error_description: "Invalid request body" },
          { status: 400 }
        );
      }
      bodyParams = new URLSearchParams();
      for (const [key, value] of Object.entries(json)) {
        if (Array.isArray(value)) {
          for (const v of value) bodyParams.append(key, String(v));
        } else if (value != null) {
          bodyParams.set(key, String(value));
        }
      }
    }

    const client_id = bodyParams.get("client_id") ?? "";
    const redirect_uri = bodyParams.get("redirect_uri") ?? "";
    const state = bodyParams.get("state") ?? undefined;
    const code_challenge = bodyParams.get("code_challenge") ?? undefined;
    const code_challenge_method = bodyParams.get("code_challenge_method") ?? undefined;
    const action = bodyParams.get("action") ?? "";
    // getAll captures every checked checkbox with name="property_id"
    const propertyIds = bodyParams.getAll("property_id");
    // GA4 property selections (optional - users may not have GA4 properties)
    const ga4PropertyIds = bodyParams.getAll("ga4_property_id");

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

    // Approval - at least one property must be selected
    const primaryPropertyId = propertyIds[0];
    if (!primaryPropertyId) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "At least one property must be selected",
        },
        { status: 400 }
      );
    }

    // Verify all selected property IDs belong to the authenticated user
    const ownedProperties = await db.gscProperty.findMany({
      where: { id: { in: propertyIds }, userId: session.id },
      select: { id: true },
    });

    const validIds = new Set(ownedProperties.map((p) => p.id));
    const invalidIds = propertyIds.filter((id) => !validIds.has(id));

    if (invalidIds.length > 0 || !validIds.has(primaryPropertyId)) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "One or more selected properties are invalid or do not belong to you" },
        { status: 400 }
      );
    }

    // Persist the GSC property selection: deactivate all, then activate only the chosen ones.
    await db.gscProperty.updateMany({
      where: { userId: session.id },
      data: { isActive: false },
    });
    await db.gscProperty.updateMany({
      where: { id: { in: Array.from(validIds) }, userId: session.id },
      data: { isActive: true },
    });

    // Persist GA4 property selection if any were provided.
    // Non-fatal - GA4 access is optional.
    if (ga4PropertyIds.length > 0) {
      try {
        const ownedGA4 = await db.ga4Property.findMany({
          where: { id: { in: ga4PropertyIds }, userId: session.id },
          select: { id: true },
        });
        const validGA4Ids = new Set(ownedGA4.map((p) => p.id));
        await db.ga4Property.updateMany({
          where: { userId: session.id },
          data: { isActive: false },
        });
        await db.ga4Property.updateMany({
          where: { id: { in: Array.from(validGA4Ids) }, userId: session.id },
          data: { isActive: true },
        });
      } catch (ga4Err) {
        console.error("[oauth/authorize] Failed to persist GA4 selection:", ga4Err);
      }
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
        propertyId: primaryPropertyId,
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
