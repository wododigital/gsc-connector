/**
 * Tool: ga_traffic_sources
 * Traffic breakdown by channel/source/medium/campaign.
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

const GROUP_BY_MAP: Record<string, string> = {
  channel: "sessionDefaultChannelGroup",
  source: "sessionSource",
  medium: "sessionMedium",
  source_medium: "sessionSourceMedium",
  campaign: "sessionCampaignName",
};

export function registerGaTrafficSourcesTool(server: McpServer, user: UserContext): void {
  server.tool(
    "ga_traffic_sources",
    "Get traffic source breakdown - where visitors come from (channels, sources, mediums, campaigns)",
    {
      property_id: z.string().max(200).describe("GA4 property to query. Use ga_list_properties to see options."),
      days: z.number().min(1).max(365).default(28).describe("Days to analyze (default 28)"),
      group_by: z
        .enum(["channel", "source", "medium", "source_medium", "campaign"])
        .default("channel")
        .describe("How to group traffic (default: channel)"),
      limit: z.number().min(1).max(100).default(10).describe("Number of sources (default 10)"),
    },
    async (params) => {
      const startTime = Date.now();
      let propertyLabel = params.property_id;
      try {
        const ctx = await getGA4Context(user.userId, params.property_id);
        propertyLabel = `${ctx.displayName} (${ctx.propertyId})`;

        const dimension = GROUP_BY_MAP[params.group_by] ?? "sessionDefaultChannelGroup";

        const response = await runGA4Report(ctx.accessToken, ctx.propertyId, {
          dateRanges: [{ startDate: `${params.days}daysAgo`, endDate: "today" }],
          dimensions: [{ name: dimension }],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "engagementRate" },
            { name: "bounceRate" },
            { name: "keyEvents" },
            { name: "averageSessionDuration" },
          ],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: String(params.limit),
        });

        const rows = parseGA4Response(response);
        logToolCall({ userId: user.userId, toolName: "ga_traffic_sources", siteUrl: ctx.propertyId, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              data: {
                property: ctx.displayName,
                property_id: ctx.propertyId,
                period: `Last ${params.days} days`,
                grouped_by: params.group_by,
                sources: rows,
                count: rows.length,
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        const responseTimeMs = Date.now() - startTime;
        const msg = error instanceof GA4ApiError ? error.userMessage(config.app.url) : error instanceof AppError ? error.message : "Failed to fetch traffic sources";
        logToolCall({ userId: user.userId, toolName: "ga_traffic_sources", siteUrl: propertyLabel, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "ga_traffic_sources", site_url: propertyLabel, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
        return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }, null, 2) }], isError: true };
      }
    }
  );
}
