/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Returns status of: Next.js (always true if this runs), MCP server, database.
 * Used by health-check.sh and monitoring.
 */

import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const checks: Record<string, boolean> = {
    nextjs: true,
    database: false,
    mcp_server: false,
  };

  // Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (err) {
    console.error("[health] DB check failed:", err);
  }

  // MCP server check (internal)
  try {
    const mcpPort = process.env.MCP_PORT || "3001";
    const res = await fetch(`http://localhost:${mcpPort}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    checks.mcp_server = res.ok;
  } catch {
    checks.mcp_server = false;
  }

  const allOk = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      ...checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
