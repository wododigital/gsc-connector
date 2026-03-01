/**
 * Tool: get_keyword_for_page
 * Returns keywords that drive traffic to a specific page URL.
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGscContext, getGscContextBySiteUrl } from "../helpers/gsc-client.js";
import { querySearchAnalytics } from "../../lib/google-api.js";
import { AppError } from "../../types/index.js";
import { logToolCall } from "../../lib/usage-logger.js";
import { logMcpError } from "../../lib/error-logger.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerKeywordForPageTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "get_keyword_for_page",
    "See which keywords drive traffic to a specific page",
    {
      page_url: z
        .string()
        .max(2000)
        .describe("The page URL to analyze (can be a partial match)"),
      days: z
        .number()
        .min(1)
        .max(90)
        .default(28)
        .describe("Number of days to analyze"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Number of keywords to return"),
      site_url: z
        .string()
        .max(500)
        .optional()
        .describe(
          "GSC property to query (e.g., 'https://example.com/'). Defaults to your primary property. Use list_my_properties to see all available properties."
        ),
    },
    async (params) => {
      const startTime = Date.now();
      let siteUrl = params.site_url || "unknown";
      try {
        const ctx = params.site_url
          ? await getGscContextBySiteUrl(user.userId, params.site_url)
          : await getGscContext(user.userId, user.propertyId);
        siteUrl = ctx.siteUrl;

        const { page_url, days, limit } = params;

        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const data = await querySearchAnalytics(
          ctx.accessToken,
          ctx.siteUrl,
          {
            startDate,
            endDate,
            dimensions: ["query"],
            dimensionFilterGroups: [
              {
                filters: [
                  {
                    dimension: "page",
                    operator: "contains",
                    expression: page_url,
                  },
                ],
              },
            ],
            rowLimit: limit,
          }
        );

        const keywords = (data.rows || []).map((row) => ({
          keyword: row.keys[0] ?? "",
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: parseFloat((row.ctr * 100).toFixed(2)),
          position: parseFloat(row.position.toFixed(1)),
        }));

        logToolCall({ userId: user.userId, toolName: "get_keyword_for_page", siteUrl: ctx.siteUrl, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    site: ctx.siteUrl,
                    page: page_url,
                    dateRange: { startDate, endDate },
                    keywords,
                    count: keywords.length,
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
          error instanceof AppError
            ? error.message
            : "Failed to fetch keywords for page";
        logToolCall({ userId: user.userId, toolName: "get_keyword_for_page", siteUrl, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "get_keyword_for_page", site_url: siteUrl, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
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
