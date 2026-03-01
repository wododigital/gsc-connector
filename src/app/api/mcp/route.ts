/**
 * MCP Proxy Route
 *
 * Proxies all MCP requests to the internal Express MCP server (localhost:3001).
 * This allows Railway (single-port deployments) to expose MCP over the same
 * port as the Next.js web app.
 *
 * External URL: https://your-app.railway.app/api/mcp
 * Internal:     http://localhost:3001/mcp
 */

import { type NextRequest, NextResponse } from "next/server";
import { logMcpRequest, logMcpError } from "@/lib/error-logger";

const INTERNAL_MCP_URL = `http://localhost:${process.env.MCP_PORT || 3001}/mcp`;
const PROXY_TIMEOUT_MS = 30_000;

// Headers to forward from client -> MCP server
const FORWARD_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "mcp-session-id",
  "mcp-protocol-version",
];

// Headers to forward from MCP server -> client
const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "mcp-session-id",
  "transfer-encoding",
  // Required so Claude.ai can discover OAuth when MCP returns 401
  "www-authenticate",
];

function buildForwardHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}

function buildResponseHeaders(
  upstream: Response,
  extra?: Record<string, string>
): Headers {
  const responseHeaders = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
    ...extra,
  });
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return responseHeaders;
}

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

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "MCP-Protocol-Version": "2025-06-18",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const upstream = await fetch(INTERNAL_MCP_URL, {
      method: "GET",
      headers: buildForwardHeaders(req),
      keepalive: true,
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: buildResponseHeaders(upstream),
    });
  } catch {
    return NextResponse.json(
      { error: "MCP server unavailable" },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let parsedBody: unknown;
  let bodyBuffer: ArrayBuffer;

  try {
    bodyBuffer = await req.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  // Parse body for logging (non-destructive - we still have the buffer)
  try {
    const text = new TextDecoder().decode(bodyBuffer);
    parsedBody = JSON.parse(text);
  } catch {
    parsedBody = null;
  }

  const toolName =
    (parsedBody as { params?: { name?: string }; method?: string })?.params?.name ||
    (parsedBody as { method?: string })?.method ||
    "unknown";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const upstream = await fetch(INTERNAL_MCP_URL, {
      method: "POST",
      headers: buildForwardHeaders(req),
      body: bodyBuffer,
      keepalive: true,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseTimeMs = Date.now() - startTime;

    // Log non-auth requests for debugging (skip initialize spam)
    if (toolName !== "unknown" && toolName !== "initialize") {
      logMcpRequest({
        timestamp: new Date().toISOString(),
        tool: toolName,
        site_url: "proxy",
        user_id: req.headers.get("authorization")?.slice(-8) ?? "unknown",
        status: upstream.status < 400 ? "success" : "error",
        response_time_ms: responseTimeMs,
        request_body: parsedBody,
        error_message: upstream.status >= 400 ? `HTTP ${upstream.status}` : undefined,
      }).catch(() => undefined);
    }

    // Log 4xx/5xx responses as errors
    if (upstream.status >= 400) {
      console.error(
        `[mcp-proxy] Upstream error ${upstream.status} for ${toolName} (${responseTimeMs}ms)`
      );
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: buildResponseHeaders(upstream),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    const errorMessage = isTimeout
      ? `MCP server did not respond within ${PROXY_TIMEOUT_MS / 1000}s`
      : "MCP server unavailable";

    logMcpError({
      timestamp: new Date().toISOString(),
      tool: toolName,
      site_url: "proxy",
      user_id: req.headers.get("authorization")?.slice(-8) ?? "unknown",
      status: isTimeout ? "timeout" : "error",
      error_message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
      response_time_ms: responseTimeMs,
      request_body: parsedBody,
    }).catch(() => undefined);

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: errorMessage,
        },
        id: null,
      },
      { status: 503 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const upstream = await fetch(INTERNAL_MCP_URL, {
      method: "DELETE",
      headers: buildForwardHeaders(req),
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: buildResponseHeaders(upstream),
    });
  } catch {
    return NextResponse.json(
      { error: "MCP server unavailable" },
      { status: 503 }
    );
  }
}
