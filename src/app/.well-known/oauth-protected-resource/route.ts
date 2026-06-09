/**
 * OAuth 2.0 Protected Resource Metadata - root well-known path
 * RFC 9728 - discovery endpoint at /.well-known/oauth-protected-resource
 * Required by MCP authorization spec 2025-06-18 (Claude.ai, ChatGPT connectors)
 * to bind the MCP resource (/api/mcp) to its authorization server.
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
