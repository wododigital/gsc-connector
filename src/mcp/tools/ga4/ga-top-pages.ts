/**
 * Tool: ga_top_pages
 * Top performing pages ranked by chosen metric.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGA4Context } from "./ga4-context.js";
import { runGA4Report, parseGA4Response, GA4ApiError } from "../../../lib/ga4/api.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";
import { config } from "../../../config/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

const SORT_METRIC_MAP: Record<string, string> = {
  sessions: "sessions",
  pageviews: "screenPageViews",
  engagement_rate: "engagementRate",
  bounce_rate: "bounceRate",
  conversions: "keyEvents",
};

export function registerGaTopPagesTool(server: McpServer, user: UserContext): void {
  server.tool(
    "ga_top_pages",
    "Get top performing pages by sessions, pageviews, engagement rate, or conversions",
    {
      property_id: z.string().describe("GA4 property to query. Use ga_list_properties to see options."),
      days: z.number().min(1).max(90).default(28).describe("Number of days to analyze (default 28, max 90)"),
      sort_by: z
        .enum(["sessions", "pageviews", "engagement_rate", "bounce_rate", "conversions"])
        .default("sessions")
        .describe("Sort metric (default: sessions)"),
      limit: z.number().min(1).max(100).default(10).describe("Number of pages (default 10, max 100)"),
    },
    async (params) => {
      const startTime = Date.now();
      let propertyLabel = params.property_id;
      try {
        const ctx = await getGA4Context(user.userId, params.property_id);
        propertyLabel = `${ctx.displayName} (${ctx.propertyId})`;

        const sortMetric = SORT_METRIC_MAP[params.sort_by] ?? "sessions";

        const response = await runGA4Report(ctx.accessToken, ctx.propertyId, {
          dateRanges: [{ startDate: `${params.days}daysAgo`, endDate: "today" }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "screenPageViews" },
            { name: "engagementRate" },
            { name: "bounceRate" },
            { name: "keyEvents" },
            { name: "averageSessionDuration" },
          ],
          orderBys: [{ metric: { metricName: sortMetric }, desc: true }],
          limit: String(params.limit),
        });

        const rows = parseGA4Response(response);
        logToolCall({ userId: user.userId, toolName: "ga_top_pages", siteUrl: ctx.propertyId, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              data: {
                property: ctx.displayName,
                property_id: ctx.propertyId,
                period: `Last ${params.days} days`,
                sorted_by: params.sort_by,
                pages: rows,
                count: rows.length,
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        const responseTimeMs = Date.now() - startTime;
        const msg = error instanceof GA4ApiError ? error.userMessage(config.app.url) : error instanceof AppError ? error.message : "Failed to fetch top pages";
        logToolCall({ userId: user.userId, toolName: "ga_top_pages", siteUrl: propertyLabel, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "ga_top_pages", site_url: propertyLabel, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
        return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }, null, 2) }], isError: true };
      }
    }
  );
}
