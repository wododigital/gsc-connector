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
  const checks: Record<string, string> = {
    nextjs: "ok",
    database: "pending",
    mcp_server: "pending",
    env_vars: "pending",
    app_url: "pending",
  };

  // Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err) {
    checks.database = "failed";
    console.error("[health] DB check failed:", err);
  }

  // MCP server check (standalone Express server on port 3001)
  try {
    const mcpPort = process.env.MCP_PORT || "3001";
    const res = await fetch(`http://localhost:${mcpPort}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    checks.mcp_server = res.ok ? "ok" : "degraded";
  } catch (err) {
    checks.mcp_server = "unreachable";
    console.error("[health] MCP check failed:", err);
  }

  // Required env vars - do not leak var names to the response
  const required = ["DATABASE_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "APP_SECRET", "ENCRYPTION_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  checks.env_vars = missing.length === 0 ? "ok" : "incomplete";
  if (missing.length > 0) {
    console.warn("[health] Missing env vars:", missing.join(", "));
  }

  // APP_URL check - do not leak internal URL
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    checks.app_url = "not configured";
  } else if (appUrl.endsWith("/")) {
    checks.app_url = "misconfigured";
  } else {
    checks.app_url = "ok";
  }

  const allOk = Object.values(checks).every((v) => v === "ok" || v.startsWith("ok ("));

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
