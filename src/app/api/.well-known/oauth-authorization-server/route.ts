/**
 * OAuth 2.0 Authorization Server Metadata
 * RFC 8414 - discovery endpoint
 * Claude.ai fetches this to understand our OAuth endpoints.
 */

import { NextResponse } from "next/server";
import { config } from "@/config/index";

export async function GET() {
  const baseUrl = config.app.url;
  return NextResponse.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    registration_endpoint: `${baseUrl}/api/oauth/register`,
    revocation_endpoint: `${baseUrl}/api/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: [
      "client_secret_post",
      "client_secret_basic",
      "none",
    ],
    scopes_supported: ["gsc:read"],
  });
}
