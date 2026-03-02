/**
 * Tool: gbp_get_performance
 * Fetches daily performance metrics for a GBP location.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGbpAccessToken } from "./gbp-context.js";
import { getGbpPerformance, GbpApiError } from "../../../lib/gbp/api.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";
import { config } from "../../../config/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerGbpGetPerformanceTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "gbp_get_performance",
    "Get daily performance metrics for a GBP location: map/search impressions, direction requests, call clicks, and website clicks.",
    {
      location_name: z
        .string()
        .max(500)
        .describe(
          'Full location path from gbp_list_locations (e.g., "accounts/123456/locations/789012")'
        ),
      start_date: z
        .string()
        .max(10)
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .default(
          (() => {
            const d = new Date();
            d.setDate(d.getDate() - 28);
            return d.toISOString().slice(0, 10);
          })()
        )
        .describe("Start date in YYYY-MM-DD format (default: 28 days ago)"),
      end_date: z
        .string()
        .max(10)
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .default(new Date().toISOString().slice(0, 10))
        .describe("End date in YYYY-MM-DD format (default: today)"),
    },
    async (params) => {
      const startTime = Date.now();
      try {
        const accessToken = await getGbpAccessToken(user.userId);
        const raw = await getGbpPerformance(
          accessToken,
          params.location_name,
          params.start_date,
          params.end_date
        );

        // Summarize totals across all metrics from the time series
        type MetricEntry = {
          metric: string;
          dailySubEntityData?: Array<{
            timeSeries?: { datedValues?: Array<{ date?: unknown; value?: string }> };
          }>;
        };
        const metricResults = (raw as { multiDailyMetricTimeSeries?: MetricEntry[] })
          .multiDailyMetricTimeSeries ?? [];

        const summary: Record<string, { total: number; daily: Array<{ date: unknown; value: number }> }> = {};

        for (const entry of metricResults) {
          const metricName = entry.metric ?? "unknown";
          const values: Array<{ date: unknown; value: number }> = [];
          let total = 0;

          for (const sub of entry.dailySubEntityData ?? []) {
            for (const dv of sub.timeSeries?.datedValues ?? []) {
              const val = parseInt(dv.value ?? "0", 10);
              values.push({ date: dv.date, value: val });
              total += val;
            }
          }

          summary[metricName] = { total, daily: values };
        }

        logToolCall({
          userId: user.userId,
          toolName: "gbp_get_performance",
          siteUrl: params.location_name,
          source: user.source,
          status: "success",
          responseTimeMs: Date.now() - startTime,
          service: "gbp",
        }).catch(() => undefined);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    location: params.location_name,
                    date_range: { start: params.start_date, end: params.end_date },
                    metrics: summary,
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
          error instanceof GbpApiError
            ? error.userMessage(config.app.url)
            : error instanceof AppError
            ? error.message
            : "Failed to fetch GBP performance metrics";

        logToolCall({
          userId: user.userId,
          toolName: "gbp_get_performance",
          siteUrl: params.location_name,
          source: user.source,
          status: "error",
          responseTimeMs,
          service: "gbp",
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "gbp_get_performance",
          site_url: params.location_name,
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
