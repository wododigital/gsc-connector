/**
 * Tool: get_search_analytics
 * Full search performance data with flexible date ranges and dimension/filter support.
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGscContext, getGscContextBySiteUrl } from "../helpers/gsc-client.js";
import { querySearchAnalytics } from "../../lib/google-api.js";
import { AppError } from "../../types/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
}

export function registerSearchAnalyticsTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "get_search_analytics",
    "Get search performance data (clicks, impressions, CTR, position) with flexible date ranges and filters",
    {
      days: z
        .number()
        .min(1)
        .max(540)
        .default(28)
        .describe("Number of days to look back from today"),
      dimensions: z
        .array(z.enum(["query", "page", "date", "country", "device"]))
        .default(["query"])
        .describe("Dimensions to group by"),
      filters: z
        .object({
          query: z
            .string()
            .optional()
            .describe("Filter by search query (contains)"),
          page: z
            .string()
            .optional()
            .describe("Filter by page URL (contains)"),
          country: z
            .string()
            .optional()
            .describe("Filter by country code (e.g., 'USA')"),
        })
        .optional()
        .describe("Optional filters"),
      row_limit: z
        .number()
        .min(1)
        .max(25000)
        .default(100)
        .describe("Number of rows to return"),
      start_date: z
        .string()
        .optional()
        .describe("Explicit start date (YYYY-MM-DD), overrides 'days'"),
      end_date: z
        .string()
        .optional()
        .describe("Explicit end date (YYYY-MM-DD)"),
      site_url: z
        .string()
        .optional()
        .describe(
          "GSC property to query (e.g., 'https://example.com/'). Defaults to your primary property. Use list_my_properties to see all available properties."
        ),
    },
    async (params) => {
      try {
        const ctx = params.site_url
          ? await getGscContextBySiteUrl(user.userId, params.site_url)
          : await getGscContext(user.userId, user.propertyId);

        const { days, dimensions, filters, row_limit, start_date, end_date } =
          params;

        const endDate =
          end_date || new Date().toISOString().split("T")[0];
        const startDate =
          start_date ||
          new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

        const requestBody: Parameters<typeof querySearchAnalytics>[2] = {
          startDate,
          endDate,
          dimensions: dimensions as string[],
          rowLimit: row_limit,
        };

        if (filters) {
          const activeFilters = Object.entries(filters).filter(
            ([, v]) => v !== undefined
          );
          if (activeFilters.length > 0) {
            requestBody.dimensionFilterGroups = [
              {
                filters: activeFilters.map(([dimension, expression]) => ({
                  dimension,
                  operator: "contains",
                  expression: expression as string,
                })),
              },
            ];
          }
        }

        const data = await querySearchAnalytics(
          ctx.accessToken,
          ctx.siteUrl,
          requestBody
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    site: ctx.siteUrl,
                    dateRange: { startDate, endDate },
                    dimensions,
                    rows: data.rows || [],
                    rowCount: data.rows?.length || 0,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to fetch search analytics data";
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
