/**
 * GSC Connect - MCP Server (Streamable HTTP transport)
 *
 * Runs on port 3001 (or MCP_PORT env var).
 * Validates Bearer tokens via the auth middleware, then creates a per-request
 * McpServer instance with all 13 GSC tools registered.
 *
 * Owned by: Coder-MCP agent
 */

import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
import { validateAuth } from "./middleware/auth.js";
import db from "../lib/db.js";

// Tool registration functions
import { registerSearchAnalyticsTool } from "./tools/search-analytics.js";
import { registerTopKeywordsTool } from "./tools/top-keywords.js";
import { registerTopPagesTool } from "./tools/top-pages.js";
import { registerKeywordForPageTool } from "./tools/keyword-for-page.js";
import { registerUrlInspectionTool } from "./tools/url-inspection.js";
import {
  registerListSitemapsTool,
  registerGetSitemapTool,
  registerSubmitSitemapTool,
  registerDeleteSitemapTool,
} from "./tools/sitemaps.js";
import {
  registerListSitesTool,
  registerAddSiteTool,
  registerDeleteSiteTool,
} from "./tools/sites.js";
import { registerMobileFriendlyTool } from "./tools/mobile-friendly.js";

// ----------------------------------------------------------------
// User context type (populated by auth middleware)
// ----------------------------------------------------------------
interface UserContext {
  userId: string;
  propertyId: string;
  siteUrl: string;
  scopes: string;
}

// ----------------------------------------------------------------
// Factory: create a fresh McpServer per request
// ----------------------------------------------------------------
function createMcpServer(user: UserContext): McpServer {
  const server = new McpServer({
    name: "gsc-connect",
    version: "1.0.0",
  });

  const userCtx = { userId: user.userId, propertyId: user.propertyId };

  // Register all 13 tools
  registerSearchAnalyticsTool(server, userCtx);
  registerTopKeywordsTool(server, userCtx);
  registerTopPagesTool(server, userCtx);
  registerKeywordForPageTool(server, userCtx);
  registerUrlInspectionTool(server, userCtx);

  // Sitemap tools
  registerListSitemapsTool(server, userCtx);
  registerGetSitemapTool(server, userCtx);
  registerSubmitSitemapTool(server, userCtx);
  registerDeleteSitemapTool(server, userCtx);

  // Site management tools
  registerListSitesTool(server, userCtx);
  registerAddSiteTool(server, userCtx);
  registerDeleteSiteTool(server, userCtx);

  // Mobile-friendly test
  registerMobileFriendlyTool(server, userCtx);

  return server;
}

// ----------------------------------------------------------------
// Usage logging helper
// ----------------------------------------------------------------
async function logUsage(
  userId: string,
  toolName: string,
  siteUrl: string
): Promise<void> {
  try {
    await db.usageLog.create({
      data: { userId, toolName, siteUrl, source: "mcp" },
    });
  } catch (err) {
    // Non-critical - never let logging failures break tool calls
    console.error("[mcp] Usage log write failed:", err);
  }
}

// ----------------------------------------------------------------
// Express app
// ----------------------------------------------------------------
const app = express();
app.use(express.json());

// CORS - allow any origin so Claude.ai / ChatGPT can reach the endpoint
app.use((_req: Request, res: Response, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, GET, OPTIONS, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, MCP-Session-Id, Accept"
  );
  if (_req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
});

// Health check - no auth required
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "gsc-connect-mcp", timestamp: new Date().toISOString() });
});

// ----------------------------------------------------------------
// MCP endpoint - all methods (POST for JSON-RPC, GET for SSE, DELETE for session)
// ----------------------------------------------------------------
app.all("/mcp", validateAuth, async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Create a stateless transport per request (no session persistence needed)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  const server = createMcpServer(user);

  try {
    await server.connect(transport);

    // Log tool call if this is a CallTool request
    if (req.method === "POST" && req.body?.method === "tools/call") {
      const toolName = req.body?.params?.name ?? "unknown";
      // Fire-and-forget - do not await to keep latency low
      logUsage(user.userId, toolName, user.siteUrl).catch(() => undefined);
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("[mcp] Request handling error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// ----------------------------------------------------------------
// Start server
// ----------------------------------------------------------------
const PORT = parseInt(process.env.MCP_PORT || "3001", 10);

app.listen(PORT, () => {
  console.log(`[MCP] GSC Connect MCP server running on port ${PORT}`);
  console.log(`[MCP] Health: http://localhost:${PORT}/health`);
  console.log(`[MCP] Endpoint: http://localhost:${PORT}/mcp`);
});

export default app;
