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
    mcp_server: "ok (integrated)",
    env_vars: "pending",
    app_url: "pending",
  };

  // Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err) {
    checks.database = `failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error("[health] DB check failed:", err);
  }

  // MCP is now integrated into Next.js at /api/mcp (no separate server needed)
  checks.mcp_server = "ok (integrated)";

  // Required env vars
  const required = ["DATABASE_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "APP_SECRET", "ENCRYPTION_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  checks.env_vars = missing.length === 0 ? "ok" : `missing: ${missing.join(", ")}`;

  // APP_URL check
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    checks.app_url = "NOT SET - redirect URIs will use localhost:3000";
  } else if (appUrl.endsWith("/")) {
    checks.app_url = `trailing slash detected: ${appUrl}`;
  } else {
    checks.app_url = `ok (${appUrl})`;
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
