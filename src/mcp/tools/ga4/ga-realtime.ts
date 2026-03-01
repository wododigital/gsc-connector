/**
 * Tool: ga_realtime
 * Real-time GA4 data from the last 30 minutes.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGA4Context } from "./ga4-context.js";
import {
  runGA4RealtimeReport,
  parseGA4Response,
  GA4ApiError,
} from "../../../lib/ga4/api.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";
import { config } from "../../../config/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerGaRealtimeTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "ga_realtime",
    "Get real-time Google Analytics data (last 30 minutes) - active users, live pages, current events",
    {
      property_id: z
        .string()
        .describe("GA4 property to query. Use ga_list_properties to see options."),
      dimensions: z
        .array(z.string())
        .default(["unifiedScreenName"])
        .describe(
          "Realtime dimensions: 'country', 'city', 'unifiedScreenName', 'deviceCategory', 'eventName', 'platform', 'minutesAgo'"
        ),
      metrics: z
        .array(z.string())
        .default(["activeUsers"])
        .describe(
          "Realtime metrics: 'activeUsers', 'eventCount', 'keyEvents', 'screenPageViews'"
        ),
      limit: z
        .number()
        .min(1)
        .max(200)
        .default(20)
        .describe("Max rows (default 20)"),
    },
    async (params) => {
      const startTime = Date.now();
      let propertyLabel = params.property_id;
      try {
        const ctx = await getGA4Context(user.userId, params.property_id);
        propertyLabel = `${ctx.displayName} (${ctx.propertyId})`;

        const response = await runGA4RealtimeReport(
          ctx.accessToken,
          ctx.propertyId,
          {
            dimensions: params.dimensions.map((d) => ({ name: d })),
            metrics: params.metrics.map((m) => ({ name: m })),
            limit: String(params.limit),
            minuteRanges: [
              { name: "last_30_min", startMinutesAgo: 29, endMinutesAgo: 0 },
            ],
          }
        );

        const rows = parseGA4Response(response);

        logToolCall({
          userId: user.userId,
          toolName: "ga_realtime",
          siteUrl: ctx.propertyId,
          source: user.source,
          status: "success",
          responseTimeMs: Date.now() - startTime,
          service: "ga4",
        }).catch(() => undefined);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    property: ctx.displayName,
                    property_id: ctx.propertyId,
                    period: "last 30 minutes",
                    dimensions: params.dimensions,
                    metrics: params.metrics,
                    rows,
                    row_count: rows.length,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const responseTimeMs = Date.now() - startTime;
        const msg =
          error instanceof GA4ApiError
            ? error.userMessage(config.app.url)
            : error instanceof AppError
            ? error.message
            : "Failed to fetch realtime GA4 data";
        logToolCall({
          userId: user.userId,
          toolName: "ga_realtime",
          siteUrl: propertyLabel,
          source: user.source,
          status: "error",
          responseTimeMs,
          service: "ga4",
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "ga_realtime",
          site_url: propertyLabel,
          user_id: user.userId,
          status: "error",
          error_message: msg,
          stack: error instanceof Error ? error.stack : undefined,
          response_time_ms: responseTimeMs,
        }).catch(() => undefined);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: false, error: msg }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
