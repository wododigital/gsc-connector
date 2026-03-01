/**
 * MCP Direct Route Handler (Single Server - Approach A)
 *
 * Handles MCP requests directly in Next.js using WebStandardStreamableHTTPServerTransport.
 * No proxy to a separate Express server - all MCP logic runs in this route.
 *
 * Session lifecycle:
 *   1. POST with initialize (no MCP-Session-Id) -> create transport + server, return session ID
 *   2. POST/GET with MCP-Session-Id -> reuse existing transport, dispatch request
 *   3. DELETE with MCP-Session-Id -> close and remove session
 */

import { type NextRequest, NextResponse } from "next/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";
import { validateMcpToken, McpAuthError, type McpUser } from "@/lib/mcp-auth";

// GSC tool registration functions
import { registerSearchAnalyticsTool } from "@/mcp/tools/search-analytics";
import { registerTopKeywordsTool } from "@/mcp/tools/top-keywords";
import { registerTopPagesTool } from "@/mcp/tools/top-pages";
import { registerKeywordForPageTool } from "@/mcp/tools/keyword-for-page";
import { registerUrlInspectionTool } from "@/mcp/tools/url-inspection";
import {
  registerListSitemapsTool,
  registerGetSitemapTool,
  registerSubmitSitemapTool,
  registerDeleteSitemapTool,
} from "@/mcp/tools/sitemaps";
import {
  registerListSitesTool,
  registerAddSiteTool,
  registerDeleteSiteTool,
} from "@/mcp/tools/sites";
import { registerMobileFriendlyTool } from "@/mcp/tools/mobile-friendly";
import { registerListMyPropertiesTool } from "@/mcp/tools/list-properties";

// GA4 tool registration functions
import {
  registerGaListPropertiesTool,
  registerGaRunReportTool,
  registerGaRealtimeTool,
  registerGaTopPagesTool,
  registerGaTrafficSourcesTool,
  registerGaConversionsTool,
  registerGaAudienceTool,
  registerGaPagePerformanceTool,
  registerGaUserJourneyTool,
  registerGaEventsTool,
} from "@/mcp/tools/ga4/index";

// Prevent Next.js from statically optimizing this route
export const dynamic = "force-dynamic";

// ----------------------------------------------------------------
// Session store - module-level, persists for the life of the process
// ----------------------------------------------------------------
interface Session {
  transport: WebStandardStreamableHTTPServerTransport;
  userId: string;
}

const sessions = new Map<string, Session>();

// ----------------------------------------------------------------
// Create a fresh McpServer with all tools registered for a user
// ----------------------------------------------------------------
function createMcpServer(user: McpUser): McpServer {
  const server = new McpServer({ name: "omg-ai", version: "1.0.0" });

  const userCtx = {
    userId: user.userId,
    propertyId: user.propertyId,
    source: user.source,
  };

  // GSC tools
  registerSearchAnalyticsTool(server, userCtx);
  registerTopKeywordsTool(server, userCtx);
  registerTopPagesTool(server, userCtx);
  registerKeywordForPageTool(server, userCtx);
  registerUrlInspectionTool(server, userCtx);
  registerListSitemapsTool(server, userCtx);
  registerGetSitemapTool(server, userCtx);
  registerSubmitSitemapTool(server, userCtx);
  registerDeleteSitemapTool(server, userCtx);
  registerListSitesTool(server, userCtx);
  registerAddSiteTool(server, userCtx);
  registerDeleteSiteTool(server, userCtx);
  registerMobileFriendlyTool(server, userCtx);
  registerListMyPropertiesTool(server, userCtx);

  // GA4 tools
  registerGaListPropertiesTool(server, userCtx);
  registerGaRunReportTool(server, userCtx);
  registerGaRealtimeTool(server, userCtx);
  registerGaTopPagesTool(server, userCtx);
  registerGaTrafficSourcesTool(server, userCtx);
  registerGaConversionsTool(server, userCtx);
  registerGaAudienceTool(server, userCtx);
  registerGaPagePerformanceTool(server, userCtx);
  registerGaUserJourneyTool(server, userCtx);
  registerGaEventsTool(server, userCtx);

  return server;
}

// ----------------------------------------------------------------
// Add CORS headers to a Web Standard Response
// ----------------------------------------------------------------
function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cache-Control", "no-cache");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ----------------------------------------------------------------
// CORS preflight
// ----------------------------------------------------------------
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, MCP-Session-Id, MCP-Protocol-Version, Accept",
    },
  });
}

// ----------------------------------------------------------------
// HEAD - protocol discovery probe
// ----------------------------------------------------------------
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "MCP-Protocol-Version": "2025-06-18",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ----------------------------------------------------------------
// Core MCP handler - shared by GET, POST, DELETE
// ----------------------------------------------------------------
async function handleMcp(req: NextRequest): Promise<Response> {
  // --- Validate Bearer token ---
  let user: McpUser;
  try {
    user = await validateMcpToken(req.headers.get("authorization"));
  } catch (err) {
    if (err instanceof McpAuthError) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (err.wwwAuthenticate) headers["WWW-Authenticate"] = err.wwwAuthenticate;
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status,
        headers,
      });
    }
    console.error("[mcp-route] Unexpected auth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sessionId = req.headers.get("mcp-session-id");

  // --- Route to existing session ---
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    if (session.userId !== user.userId) {
      return new Response(
        JSON.stringify({ error: "Session belongs to a different user" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    try {
      return withCors(await session.transport.handleRequest(req));
    } catch (err) {
      console.error(`[mcp-route] Transport error for session ${sessionId}:`, err);
      return new Response(
        JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // --- No session: only POST can initialize ---
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse body to verify it is an initialize request
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!isInitializeRequest(body)) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session ID provided" },
        id: null,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // --- Create new transport + server ---
  // `let` is used so the onsessioninitialized closure can capture the reference.
  // By the time the callback fires (after handleRequest), `transport` is assigned.
  // eslint-disable-next-line prefer-const
  let transport: WebStandardStreamableHTTPServerTransport;
  transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
    onsessioninitialized: (id) => {
      sessions.set(id, { transport, userId: user.userId });
      console.log(`[MCP] Session created: ${id} for user ${user.userId}`);
    },
    onsessionclosed: (id) => {
      sessions.delete(id);
      console.log(`[MCP] Session closed: ${id}`);
    },
  });

  const server = createMcpServer(user);
  await server.connect(transport);

  // Pass the already-parsed body so the transport does not attempt to re-read the stream
  try {
    return withCors(await transport.handleRequest(req, { parsedBody: body }));
  } catch (err) {
    console.error("[mcp-route] Initialize error:", err);
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleMcp(req);
}

export async function POST(req: NextRequest) {
  return handleMcp(req);
}

export async function DELETE(req: NextRequest) {
  return handleMcp(req);
}
