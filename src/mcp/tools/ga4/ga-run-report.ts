/**
 * Tool: ga_run_report
 * Flexible GA4 Data API report.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGA4Context } from "./ga4-context.js";
import {
  runGA4Report,
  parseGA4Response,
  buildFilterExpression,
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

export function registerGaRunReportTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "ga_run_report",
    "Run a custom Google Analytics 4 report with flexible dimensions and metrics",
    {
      property_id: z
        .string()
        .max(200)
        .describe(
          "GA4 property to query (e.g., 'properties/987654321' or display name like 'nandhini.com'). Use ga_list_properties to see available options."
        ),
      dimensions: z
        .array(z.string().max(100))
        .max(9)
        .default(["date"])
        .describe(
          "Dimensions to group by (e.g., 'date', 'pagePath', 'country', 'sessionSource', 'deviceCategory')"
        ),
      metrics: z
        .array(z.string().max(100))
        .max(10)
        .default(["sessions", "activeUsers"])
        .describe(
          "Metrics to retrieve (e.g., 'sessions', 'activeUsers', 'bounceRate', 'keyEvents', 'screenPageViews')"
        ),
      start_date: z
        .string()
        .max(20)
        .default("28daysAgo")
        .describe("Start date (YYYY-MM-DD or relative like '28daysAgo', '7daysAgo')"),
      end_date: z
        .string()
        .max(20)
        .default("today")
        .describe("End date (YYYY-MM-DD or 'today')"),
      dimension_filter: z
        .record(z.unknown())
        .optional()
        .describe(
          "Optional filter. Shorthand: {fieldName: 'country', matchType: 'EXACT', value: 'India'}"
        ),
      limit: z
        .number()
        .min(1)
        .max(10000)
        .default(100)
        .describe("Max rows (default 100, max 10000)"),
      order_by: z
        .string()
        .max(100)
        .optional()
        .describe(
          "Metric or dimension to sort by (prefix with '-' for descending, e.g., '-sessions')"
        ),
    },
    async (params) => {
      const startTime = Date.now();
      let propertyLabel = params.property_id;
      try {
        const ctx = await getGA4Context(user.userId, params.property_id);
        propertyLabel = `${ctx.displayName} (${ctx.propertyId})`;

        const orderBy = params.order_by
          ? (() => {
              const desc = params.order_by.startsWith("-");
              const name = params.order_by.replace(/^-/, "");
              // Heuristic: if it looks like a metric (no uppercase at start) use metric sort
              return [{ metric: { metricName: name }, desc }];
            })()
          : undefined;

        const filter = buildFilterExpression(
          params.dimension_filter as Parameters<typeof buildFilterExpression>[0]
        );

        const response = await runGA4Report(ctx.accessToken, ctx.propertyId, {
          dateRanges: [
            { startDate: params.start_date, endDate: params.end_date },
          ],
          dimensions: params.dimensions.map((d) => ({ name: d })),
          metrics: params.metrics.map((m) => ({ name: m })),
          dimensionFilter: filter,
          orderBys: orderBy,
          limit: String(params.limit),
        });

        const rows = parseGA4Response(response);

        logToolCall({
          userId: user.userId,
          toolName: "ga_run_report",
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
                    date_range: {
                      start: params.start_date,
                      end: params.end_date,
                    },
                    dimensions: params.dimensions,
                    metrics: params.metrics,
                    rows,
                    row_count: rows.length,
                    total_rows: response.rowCount ?? rows.length,
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
            : "Failed to run GA4 report";
        logToolCall({
          userId: user.userId,
          toolName: "ga_run_report",
          siteUrl: propertyLabel,
          source: user.source,
          status: "error",
          responseTimeMs,
          service: "ga4",
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "ga_run_report",
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
