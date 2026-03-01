/**
 * Tool: ga_conversions
 * Key events / conversion data.
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

const BREAKDOWN_MAP: Record<string, string> = {
  event_name: "eventName",
  source: "sessionSource",
  medium: "sessionMedium",
  page: "pagePath",
  country: "country",
  date: "date",
};

export function registerGaConversionsTool(server: McpServer, user: UserContext): void {
  server.tool(
    "ga_conversions",
    "Get conversion/key event data with optional breakdown by source, page, or country",
    {
      property_id: z.string().max(200).describe("GA4 property to query. Use ga_list_properties to see options."),
      days: z.number().min(1).max(365).default(28).describe("Days to analyze (default 28)"),
      breakdown_by: z
        .enum(["event_name", "source", "medium", "page", "country", "date"])
        .optional()
        .describe("Breakdown dimension (optional)"),
      limit: z.number().min(1).max(100).default(10).describe("Number of rows (default 10)"),
    },
    async (params) => {
      const startTime = Date.now();
      let propertyLabel = params.property_id;
      try {
        const ctx = await getGA4Context(user.userId, params.property_id);
        propertyLabel = `${ctx.displayName} (${ctx.propertyId})`;

        const dimensions = params.breakdown_by
          ? [{ name: BREAKDOWN_MAP[params.breakdown_by] ?? params.breakdown_by }]
          : [{ name: "date" }];

        const response = await runGA4Report(ctx.accessToken, ctx.propertyId, {
          dateRanges: [{ startDate: `${params.days}daysAgo`, endDate: "today" }],
          dimensions,
          metrics: [
            { name: "keyEvents" },
            { name: "sessions" },
            { name: "activeUsers" },
          ],
          orderBys: [{ metric: { metricName: "keyEvents" }, desc: true }],
          limit: String(params.limit),
        });

        const rows = parseGA4Response(response);
        logToolCall({ userId: user.userId, toolName: "ga_conversions", siteUrl: ctx.propertyId, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              data: {
                property: ctx.displayName,
                property_id: ctx.propertyId,
                period: `Last ${params.days} days`,
                breakdown_by: params.breakdown_by ?? "date",
                note: "GA4 uses 'key events' (keyEvents) instead of 'conversions'. Configure key events in your GA4 property settings.",
                conversions: rows,
                count: rows.length,
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        const responseTimeMs = Date.now() - startTime;
        const msg = error instanceof GA4ApiError ? error.userMessage(config.app.url) : error instanceof AppError ? error.message : "Failed to fetch conversion data";
        logToolCall({ userId: user.userId, toolName: "ga_conversions", siteUrl: propertyLabel, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "ga_conversions", site_url: propertyLabel, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
        return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }, null, 2) }], isError: true };
      }
    }
  );
}
