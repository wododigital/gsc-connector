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

const INTERNAL_MCP_URL = `http://localhost:${process.env.MCP_PORT || 3001}/mcp`;

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
  try {
    const body = await req.arrayBuffer();

    const upstream = await fetch(INTERNAL_MCP_URL, {
      method: "POST",
      headers: buildForwardHeaders(req),
      body,
      keepalive: true,
    });

    // Stream the response body back (MCP uses streaming JSON)
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
