/**
 * Tool: ga_user_journey
 * Landing page performance and user flow patterns.
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

export function registerGaUserJourneyTool(server: McpServer, user: UserContext): void {
  server.tool(
    "ga_user_journey",
    "See which pages users land on and how they engage - landing page performance and entry point analysis",
    {
      property_id: z.string().describe("GA4 property to query. Use ga_list_properties to see options."),
      days: z.number().min(1).max(365).default(28).describe("Days to analyze (default 28)"),
      limit: z.number().min(1).max(100).default(10).describe("Number of pages (default 10)"),
    },
    async (params) => {
      const startTime = Date.now();
      let propertyLabel = params.property_id;
      try {
        const ctx = await getGA4Context(user.userId, params.property_id);
        propertyLabel = `${ctx.displayName} (${ctx.propertyId})`;

        const response = await runGA4Report(ctx.accessToken, ctx.propertyId, {
          dateRanges: [{ startDate: `${params.days}daysAgo`, endDate: "today" }],
          dimensions: [{ name: "landingPagePlusQueryString" }],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "newUsers" },
            { name: "engagementRate" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
            { name: "keyEvents" },
          ],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: String(params.limit),
        });

        const rows = parseGA4Response(response);
        logToolCall({ userId: user.userId, toolName: "ga_user_journey", siteUrl: ctx.propertyId, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              data: {
                property: ctx.displayName,
                property_id: ctx.propertyId,
                period: `Last ${params.days} days`,
                landing_pages: rows,
                count: rows.length,
                tip: "newUsers = first-time visitors who entered on this page. High bounce_rate on a landing page means visitors left without interacting.",
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        const responseTimeMs = Date.now() - startTime;
        const msg = error instanceof GA4ApiError ? error.userMessage(config.app.url) : error instanceof AppError ? error.message : "Failed to fetch user journey data";
        logToolCall({ userId: user.userId, toolName: "ga_user_journey", siteUrl: propertyLabel, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "ga_user_journey", site_url: propertyLabel, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
        return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }, null, 2) }], isError: true };
      }
    }
  );
}
