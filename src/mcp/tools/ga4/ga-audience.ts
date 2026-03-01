/**
 * Tool: ga_audience
 * Demographics, technology, and geographic audience data.
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

const REPORT_CONFIG = {
  demographics: {
    dimensions: ["userAgeBracket", "userGender"],
    metrics: ["activeUsers", "sessions", "engagementRate"],
  },
  technology: {
    dimensions: ["browser", "deviceCategory", "operatingSystem"],
    metrics: ["activeUsers", "sessions", "engagementRate"],
  },
  geo: {
    dimensions: ["country", "city"],
    metrics: ["activeUsers", "sessions", "engagementRate", "keyEvents"],
  },
};

export function registerGaAudienceTool(server: McpServer, user: UserContext): void {
  server.tool(
    "ga_audience",
    "Get audience demographics, technology, or geographic data",
    {
      property_id: z.string().describe("GA4 property to query. Use ga_list_properties to see options."),
      days: z.number().min(1).max(365).default(28).describe("Days to analyze (default 28)"),
      report_type: z
        .enum(["demographics", "technology", "geo"])
        .default("geo")
        .describe("Type of audience report (default: geo)"),
      limit: z.number().min(1).max(100).default(10).describe("Number of rows (default 10)"),
    },
    async (params) => {
      const startTime = Date.now();
      let propertyLabel = params.property_id;
      try {
        const ctx = await getGA4Context(user.userId, params.property_id);
        propertyLabel = `${ctx.displayName} (${ctx.propertyId})`;

        const cfg = REPORT_CONFIG[params.report_type];

        const response = await runGA4Report(ctx.accessToken, ctx.propertyId, {
          dateRanges: [{ startDate: `${params.days}daysAgo`, endDate: "today" }],
          dimensions: cfg.dimensions.map((d) => ({ name: d })),
          metrics: cfg.metrics.map((m) => ({ name: m })),
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
          limit: String(params.limit),
        });

        const rows = parseGA4Response(response);
        logToolCall({ userId: user.userId, toolName: "ga_audience", siteUrl: ctx.propertyId, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              data: {
                property: ctx.displayName,
                property_id: ctx.propertyId,
                period: `Last ${params.days} days`,
                report_type: params.report_type,
                audience: rows,
                count: rows.length,
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        const responseTimeMs = Date.now() - startTime;
        const msg = error instanceof GA4ApiError ? error.userMessage(config.app.url) : error instanceof AppError ? error.message : "Failed to fetch audience data";
        logToolCall({ userId: user.userId, toolName: "ga_audience", siteUrl: propertyLabel, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "ga_audience", site_url: propertyLabel, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
        return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: msg }, null, 2) }], isError: true };
      }
    }
  );
}
