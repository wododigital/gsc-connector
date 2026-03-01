/**
 * Dynamic Client Registration
 * RFC 7591 - Claude.ai calls this to register itself as an OAuth client.
 *
 * POST /api/oauth/register
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID, randomBytes, createHash } from "crypto";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        {
          error: "invalid_client_metadata",
          error_description: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const {
      client_name,
      redirect_uris,
      grant_types,
      response_types,
      token_endpoint_auth_method,
    } = body as {
      client_name?: string;
      redirect_uris?: string[];
      grant_types?: string[];
      response_types?: string[];
      token_endpoint_auth_method?: string;
    };

    if (
      !redirect_uris ||
      !Array.isArray(redirect_uris) ||
      redirect_uris.length === 0
    ) {
      return NextResponse.json(
        {
          error: "invalid_client_metadata",
          error_description: "redirect_uris is required and must be a non-empty array",
        },
        { status: 400 }
      );
    }

    // Validate all redirect_uris are strings
    if (!redirect_uris.every((uri) => typeof uri === "string")) {
      return NextResponse.json(
        {
          error: "invalid_client_metadata",
          error_description: "All redirect_uris must be strings",
        },
        { status: 400 }
      );
    }

    // Validate all redirect_uris are valid URLs with safe schemes
    const BLOCKED_SCHEMES = ["javascript:", "data:", "vbscript:"];
    for (const uri of redirect_uris) {
      let parsed: URL;
      try {
        parsed = new URL(uri);
      } catch {
        return NextResponse.json(
          {
            error: "invalid_client_metadata",
            error_description: `Invalid redirect_uri: ${uri} is not a valid URL`,
          },
          { status: 400 }
        );
      }
      if (BLOCKED_SCHEMES.includes(parsed.protocol)) {
        return NextResponse.json(
          {
            error: "invalid_client_metadata",
            error_description: `Invalid redirect_uri scheme in: ${uri}`,
          },
          { status: 400 }
        );
      }
    }

    const clientId = randomUUID();
    const clientSecret = randomBytes(32).toString("hex");
    const clientSecretHash = createHash("sha256")
      .update(clientSecret)
      .digest("hex");

    const resolvedGrantTypes =
      Array.isArray(grant_types) && grant_types.length > 0
        ? grant_types
        : ["authorization_code", "refresh_token"];

    const resolvedAuthMethod =
      typeof token_endpoint_auth_method === "string"
        ? token_endpoint_auth_method
        : "client_secret_post";

    await db.oAuthClient.create({
      data: {
        clientId,
        clientSecretHash,
        clientName: typeof client_name === "string" ? client_name : "Unknown Client",
        redirectUris: redirect_uris,
        grantTypes: resolvedGrantTypes,
        tokenEndpointAuthMethod: resolvedAuthMethod,
      },
    });

    return NextResponse.json(
      {
        client_id: clientId,
        client_secret: clientSecret,
        client_name: typeof client_name === "string" ? client_name : "Unknown Client",
        redirect_uris,
        grant_types: resolvedGrantTypes,
        response_types:
          Array.isArray(response_types) && response_types.length > 0
            ? response_types
            : ["code"],
        token_endpoint_auth_method: resolvedAuthMethod,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[oauth/register] Unexpected error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
