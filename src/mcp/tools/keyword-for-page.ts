/**
 * Tool: get_keyword_for_page
 * Returns keywords that drive traffic to a specific page URL.
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGscContext } from "../helpers/gsc-client.js";
import { querySearchAnalytics } from "../../lib/google-api.js";
import { AppError } from "../../types/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
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
    },
    async (params) => {
      try {
        const ctx = await getGscContext(user.userId, user.propertyId);
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

        const keywords = (data.rows as Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> || []).map((row) => ({
          keyword: row.keys[0] ?? "",
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: parseFloat((row.ctr * 100).toFixed(2)),
          position: parseFloat(row.position.toFixed(1)),
        }));

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
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to fetch keywords for page";
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
