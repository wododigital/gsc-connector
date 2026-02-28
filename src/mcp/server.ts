/**
 * GSC Connect - MCP Server (Streamable HTTP transport)
 *
 * Runs on port 3001 (or MCP_PORT env var).
 * Validates Bearer tokens via the auth middleware, then creates a per-SESSION
 * McpServer instance with all 13 GSC tools registered.
 *
 * Session lifecycle (required by MCP Streamable HTTP spec):
 *   1. POST with initialize (no MCP-Session-Id) → create transport + server, return session ID
 *   2. POST with MCP-Session-Id → reuse existing transport, dispatch request
 *   3. DELETE with MCP-Session-Id → close and remove session
 *
 * Owned by: Coder-MCP agent
 */

import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
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
// Session store: maps MCP-Session-Id → { transport, userId }
// ----------------------------------------------------------------
interface Session {
  transport: StreamableHTTPServerTransport;
  userId: string;
}

const sessions = new Map<string, Session>();

// ----------------------------------------------------------------
// Factory: create a fresh McpServer per session (not per request)
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
    "POST, GET, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, MCP-Session-Id, MCP-Protocol-Version, Accept"
  );
  if (_req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
});

// Health check - no auth required
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "gsc-connect-mcp",
    timestamp: new Date().toISOString(),
    sessions: sessions.size,
  });
});

// ----------------------------------------------------------------
// POST /mcp - main JSON-RPC handler (initialize or dispatch to session)
// ----------------------------------------------------------------
app.post("/mcp", validateAuth, async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // ---- Path 1: Request carries an existing session ID ----
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;

      // Security: ensure the authenticated user owns this session
      if (session.userId !== user.userId) {
        res.status(403).json({ error: "Session belongs to a different user" });
        return;
      }

      // Log tool calls (fire-and-forget)
      if (req.body?.method === "tools/call") {
        const toolName = (req.body?.params?.name as string) ?? "unknown";
        logUsage(user.userId, toolName, user.siteUrl).catch(() => undefined);
      }

      await session.transport.handleRequest(req, res, req.body);
      return;
    }

    // ---- Path 2: No session ID - must be an initialize request ----
    if (!sessionId && isInitializeRequest(req.body)) {
      // enableJsonResponse: true - use plain JSON responses (no SSE streaming).
      // This avoids SSE buffering issues through the Next.js proxy.
      let transport: StreamableHTTPServerTransport;
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (id) => {
          // Register session in the store as soon as the ID is assigned.
          // Using the callback (not after handleRequest) avoids race conditions.
          sessions.set(id, { transport, userId: user.userId });
          console.log(`[MCP] Session created: ${id} for user ${user.userId}`);

          // Auto-cleanup when transport closes
          transport.onclose = () => {
            sessions.delete(id);
            console.log(`[MCP] Session closed: ${id}`);
          };
        },
      });

      const server = createMcpServer(user);
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // ---- Path 3: Unknown session ID or non-initialize without session ----
    // Return JSON-RPC error so Claude.ai knows to re-initialize
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: null,
    });
  } catch (error) {
    console.error("[mcp] POST error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// ----------------------------------------------------------------
// GET /mcp - SSE stream for server-initiated messages
// We use JSON response mode so GET is not needed for standard flows.
// Return 405 to tell clients to use POST only.
// ----------------------------------------------------------------
app.get("/mcp", validateAuth, async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    if (session.userId !== user.userId) {
      res.status(403).json({ error: "Session belongs to a different user" });
      return;
    }
    // Forward to transport in case the client opens a GET SSE stream
    await session.transport.handleRequest(req, res, undefined);
    return;
  }

  res.status(405).set("Allow", "POST").send("Method Not Allowed");
});

// ----------------------------------------------------------------
// DELETE /mcp - explicit session termination
// ----------------------------------------------------------------
app.delete("/mcp", validateAuth, async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    if (session.userId !== user.userId) {
      res.status(403).json({ error: "Session belongs to a different user" });
      return;
    }
    await session.transport.close();
    sessions.delete(sessionId);
    console.log(`[MCP] Session deleted: ${sessionId}`);
    res.status(200).end();
    return;
  }

  res.status(404).json({ error: "Session not found" });
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
