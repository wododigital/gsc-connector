/**
 * OAuth 2.0 Protected Resource Metadata - /api alias
 * Mirrors /.well-known/oauth-protected-resource for MCP client compatibility.
 */

import { NextResponse } from "next/server";
import { config } from "@/config/index";

export async function GET() {
  const baseUrl = config.app.url;
  return NextResponse.json(
    {
      resource: `${baseUrl}/api/mcp`,
      authorization_servers: [baseUrl],
      bearer_methods_supported: ["header"],
      scopes_supported: ["gsc:read"],
      resource_documentation: `${baseUrl}/docs`,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
