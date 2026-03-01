/**
 * OAuth 2.0 Authorization Server Metadata - root well-known path
 * RFC 8414 - discovery endpoint at /.well-known/oauth-authorization-server
 * Mirrors /api/.well-known/oauth-authorization-server for MCP client compatibility.
 * Claude.ai and ChatGPT look for this at the root of the server.
 */

import { NextResponse } from "next/server";
import { config } from "@/config/index";

export async function GET() {
  const baseUrl = config.app.url;
  return NextResponse.json(
    {
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
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
