/**
 * Tool: get_top_keywords
 * Returns the top performing keywords for the connected property.
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGscContext } from "../helpers/gsc-client.js";
import { querySearchAnalytics } from "../../lib/google-api.js";
import { AppError } from "../../types/index.js";
import type { SearchAnalyticsRow } from "../../types/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
}

const SORT_FIELD_MAP: Record<string, keyof SearchAnalyticsRow> = {
  clicks: "clicks",
  impressions: "impressions",
  ctr: "ctr",
  position: "position",
};

export function registerTopKeywordsTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "get_top_keywords",
    "List top keywords by performance (clicks, impressions, CTR, or position)",
    {
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
        .default(10)
        .describe("Number of keywords to return"),
      sort_by: z
        .enum(["clicks", "impressions", "ctr", "position"])
        .default("clicks")
        .describe("Sort metric"),
    },
    async (params) => {
      try {
        const ctx = await getGscContext(user.userId, user.propertyId);
        const { days, limit, sort_by } = params;

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
            rowLimit: 1000, // Fetch more than needed to allow client-side sort
          }
        );

        const rows: SearchAnalyticsRow[] = data.rows || [];
        const sortField = SORT_FIELD_MAP[sort_by];

        // Sort ascending for position (lower is better), descending for everything else
        const sorted = [...rows].sort((a, b) => {
          if (sort_by === "position") {
            return (a[sortField] as number) - (b[sortField] as number);
          }
          return (b[sortField] as number) - (a[sortField] as number);
        });

        const topKeywords = sorted.slice(0, limit).map((row) => ({
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
                    dateRange: { startDate, endDate },
                    sortedBy: sort_by,
                    keywords: topKeywords,
                    count: topKeywords.length,
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
            : "Failed to fetch top keywords";
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
