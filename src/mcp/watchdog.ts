/**
 * MCP watchdog - periodic self-monitoring that pushes admin alerts.
 *
 * Runs inside the MCP server process every WATCHDOG_INTERVAL_MINUTES.
 * Checks the last WATCHDOG_WINDOW_MINUTES of mcp_debug_logs for:
 *  1. Error spikes: total error-status rows >= WATCHDOG_ERROR_THRESHOLD.
 *  2. Proxy failures: any rows with siteUrl="proxy" (written by the Next.js
 *     /api/mcp proxy when this MCP server was unreachable or timed out).
 *
 * Alerts go through sendAdminAlert, which dedupes for 60 minutes, so a
 * sustained incident produces one email per hour, not one per sweep.
 * The sweep itself is fully guarded - a watchdog failure must never take
 * down the MCP server.
 */

import db from "../lib/db.js";
import { sendAdminAlert } from "../lib/admin-alert.js";

const INTERVAL_MINUTES = parseInt(process.env.WATCHDOG_INTERVAL_MINUTES || "5", 10);
const WINDOW_MINUTES = parseInt(process.env.WATCHDOG_WINDOW_MINUTES || "15", 10);
const ERROR_THRESHOLD = parseInt(process.env.WATCHDOG_ERROR_THRESHOLD || "10", 10);

async function sweep(): Promise<void> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const [errorCount, proxyErrors] = await Promise.all([
    db.mcpDebugLog.count({
      where: { status: "error", timestamp: { gte: since } },
    }),
    db.mcpDebugLog.count({
      where: { siteUrl: "proxy", status: { not: "success" }, timestamp: { gte: since } },
    }),
  ]);

  if (proxyErrors > 0) {
    await sendAdminAlert({
      type: "mcp_proxy_down",
      severity: "error",
      title: `MCP server was unreachable (${proxyErrors} proxy failures in ${WINDOW_MINUTES}m)`,
      message:
        `The Next.js /api/mcp proxy logged ${proxyErrors} failures reaching the MCP ` +
        `server in the last ${WINDOW_MINUTES} minutes. Users may be seeing dead ` +
        `connectors. Check Railway logs and service health.`,
      dedupeKey: "proxy",
      metadata: { proxyErrors, windowMinutes: WINDOW_MINUTES },
    });
  }

  if (errorCount >= ERROR_THRESHOLD) {
    // Include a small breakdown of the top failing tools for triage
    const topTools = await db.mcpDebugLog.groupBy({
      by: ["tool"],
      where: { status: "error", timestamp: { gte: since } },
      _count: { tool: true },
      orderBy: { _count: { tool: "desc" } },
      take: 5,
    });

    await sendAdminAlert({
      type: "mcp_error_spike",
      severity: "warning",
      title: `MCP error spike: ${errorCount} tool errors in ${WINDOW_MINUTES}m`,
      message:
        `${errorCount} MCP tool calls failed in the last ${WINDOW_MINUTES} minutes ` +
        `(threshold ${ERROR_THRESHOLD}). Top failing tools: ` +
        topTools.map((t) => `${t.tool} (${t._count.tool})`).join(", ") +
        `. Review /admin/errors for details.`,
      dedupeKey: "spike",
      metadata: { errorCount, windowMinutes: WINDOW_MINUTES },
    });
  }
}

export function startWatchdog(): void {
  setInterval(() => {
    sweep().catch((err) => console.error("[watchdog] Sweep failed:", err));
  }, INTERVAL_MINUTES * 60 * 1000);
  console.log(
    `[watchdog] Started: every ${INTERVAL_MINUTES}m, window ${WINDOW_MINUTES}m, ` +
      `error threshold ${ERROR_THRESHOLD}`
  );
}
