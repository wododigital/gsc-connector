/**
 * Tool: ga_page_performance
 * Deep dive into a specific page's performance.
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

export function registerGaPagePerformanceTool(server: McpServer, user: UserContext): void {
  server.tool(
    "ga_page_performance",
    "Get detailed performance metrics for a specific page URL - complements GSC keyword data with behavior metrics",
    {
      property_id: z.string().max(200).describe("GA4 property to query. Use ga_list_properties to see options."),
      page_path: z
        .string()
        .max(2000)
        .describe("Page URL path to analyze (partial match supported, e.g., '/blog/my-post')"),
      days: z.number().min(1).max(365).default(28).describe("Days to analyze (default 28)"),
    },
    async (params) => {
      const startTime = Date.now();
      let propertyLabel = params.property_id;
      try {
        const ctx = await getGA4Context(user.userId, params.property_id);
        propertyLabel = `${ctx.displayName} (${ctx.propertyId})`;

        // Primary metrics for the page
        const pageMetricsResponse = await runGA4Report(ctx.accessToken, ctx.propertyId, {
          dateRanges: [{ startDate: `${params.days}daysAgo`, endDate: "today" }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "screenPageViews" },
            { name: "engagementRate" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
            { name: "keyEvents" },
          ],
          dimensionFilter: {
            filter: {
              fieldName: "pagePath",
              stringFilter: {
                matchType: "CONTAINS",
                value: params.page_path,
              },
            },
          },
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: "10",
        });

        // Traffic sources breakdown for this page
        const sourceResponse = await runGA4Report(ctx.accessToken, ctx.propertyId, {
          dateRanges: [{ startDate: `${params.days}daysAgo`, endDate: "today" }],
          dimensions: [{ name: "pagePath" }, { name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }, { name: "activeUsers" }],
          dimensionFilter: {
            filter: {
              fieldName: "pagePath",
              stringFilter: {
                matchType: "CONTAINS",
                value: params.page_path,
              },
            },
          },
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: "10",
        });

        const pageRows = parseGA4Response(pageMetricsResponse);
        const sourceRows = parseGA4Response(sourceResponse);

        logToolCall({ userId: user.userId, toolName: "ga_page_performance", siteUrl: ctx.propertyId, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              data: {
                property: ctx.displayName,
                property_id: ctx.propertyId,
                period: `Last ${params.days} days`,
                page_filter: params.page_path,
                page_metrics: pageRows,
                traffic_sources: sourceRows,
                tip: "Pair with GSC get_keyword_for_page to see keywords driving traffic to this page.",
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        const responseTimeMs = Date.now() - startTime;
        const msg = error instanceof GA4ApiError ? error.userMessage(config.app.url) : error instanceof AppError ? error.message : "Failed to fetch page performance data";
        logToolCall({ userId: user.userId, toolName: "ga_page_performance", siteUrl: propertyLabel, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "ga_page_performance", site_url: propertyLabel, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
        return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }, null, 2) }], isError: true };
      }
    }
  );
}
