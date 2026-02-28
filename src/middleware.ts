/**
 * Next.js Edge Middleware
 *
 * Adds CORS headers to all OAuth, MCP, and well-known discovery endpoints.
 * Handles OPTIONS preflight requests before they reach individual route handlers,
 * which is required for Claude.ai and other AI tools making cross-origin requests.
 */

import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Accept, MCP-Session-Id, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

export function middleware(request: NextRequest) {
  // Short-circuit OPTIONS preflight - never hit the route handler
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
  }

  // Pass through to route handler, merging CORS headers into the response
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    // OAuth provider endpoints
    "/api/oauth/:path*",
    // MCP proxy (and path-aware well-known discovery under it)
    "/api/mcp",
    "/api/mcp/:path*",
    // Well-known discovery after rewrite
    "/api/.well-known/:path*",
    // Well-known discovery before rewrite (root path)
    "/.well-known/:path*",
  ],
};
