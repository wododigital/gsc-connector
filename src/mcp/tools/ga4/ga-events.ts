/**
 * Tool: ga_events
 * Event counts and breakdown.
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

export function registerGaEventsTool(server: McpServer, user: UserContext): void {
  server.tool(
    "ga_events",
    "Get event data - see which events are firing and how often",
    {
      property_id: z.string().max(200).describe("GA4 property to query. Use ga_list_properties to see options."),
      days: z.number().min(1).max(365).default(28).describe("Days to analyze (default 28)"),
      event_name: z
        .string()
        .max(200)
        .optional()
        .describe("Filter to a specific event name (optional, e.g., 'page_view', 'click')"),
      limit: z.number().min(1).max(100).default(20).describe("Number of events (default 20)"),
    },
    async (params) => {
      const startTime = Date.now();
      let propertyLabel = params.property_id;
      try {
        const ctx = await getGA4Context(user.userId, params.property_id);
        propertyLabel = `${ctx.displayName} (${ctx.propertyId})`;

        const dimensionFilter = params.event_name
          ? {
              filter: {
                fieldName: "eventName",
                stringFilter: {
                  matchType: "EXACT" as const,
                  value: params.event_name,
                },
              },
            }
          : undefined;

        const response = await runGA4Report(ctx.accessToken, ctx.propertyId, {
          dateRanges: [{ startDate: `${params.days}daysAgo`, endDate: "today" }],
          dimensions: [{ name: "eventName" }],
          metrics: [
            { name: "eventCount" },
            { name: "totalUsers" },
            { name: "eventCountPerUser" },
          ],
          dimensionFilter,
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: String(params.limit),
        });

        const rows = parseGA4Response(response);
        logToolCall({ userId: user.userId, toolName: "ga_events", siteUrl: ctx.propertyId, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              data: {
                property: ctx.displayName,
                property_id: ctx.propertyId,
                period: `Last ${params.days} days`,
                event_filter: params.event_name ?? "all events",
                events: rows,
                count: rows.length,
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        const responseTimeMs = Date.now() - startTime;
        const msg = error instanceof GA4ApiError ? error.userMessage(config.app.url) : error instanceof AppError ? error.message : "Failed to fetch event data";
        logToolCall({ userId: user.userId, toolName: "ga_events", siteUrl: propertyLabel, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "ga_events", site_url: propertyLabel, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
        return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }, null, 2) }], isError: true };
      }
    }
  );
}
