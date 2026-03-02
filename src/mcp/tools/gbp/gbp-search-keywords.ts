/**
 * Tool: gbp_search_keywords
 * Fetches monthly search keywords driving GBP impressions.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGbpAccessToken } from "./gbp-context.js";
import { getGbpSearchKeywords, GbpApiError } from "../../../lib/gbp/api.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";
import { config } from "../../../config/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerGbpSearchKeywordsTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "gbp_search_keywords",
    "Get the top monthly search keywords that drove impressions for a GBP location. Useful for local SEO keyword analysis.",
    {
      location_name: z
        .string()
        .max(500)
        .describe(
          'Full location path from gbp_list_locations (e.g., "accounts/123456/locations/789012")'
        ),
    },
    async (params) => {
      const startTime = Date.now();
      try {
        const accessToken = await getGbpAccessToken(user.userId);
        const raw = await getGbpSearchKeywords(accessToken, params.location_name);

        // Parse the keyword impressions response
        type KeywordEntry = {
          searchKeyword?: string;
          insightsValue?: { value?: string; threshold?: string };
        };
        const keywordsRaw =
          (raw as { searchKeywordsCounts?: KeywordEntry[] }).searchKeywordsCounts ?? [];

        const keywords = keywordsRaw
          .map((k) => ({
            keyword: k.searchKeyword ?? "",
            impressions: parseInt(k.insightsValue?.value ?? "0", 10),
            is_approximate: !!k.insightsValue?.threshold,
          }))
          .filter((k) => k.keyword)
          .sort((a, b) => b.impressions - a.impressions);

        logToolCall({
          userId: user.userId,
          toolName: "gbp_search_keywords",
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
                    keyword_count: keywords.length,
                    keywords,
                    note: "Impressions are monthly totals. Values marked is_approximate are below the reporting threshold.",
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
            : "Failed to fetch GBP search keywords";

        logToolCall({
          userId: user.userId,
          toolName: "gbp_search_keywords",
          siteUrl: params.location_name,
          source: user.source,
          status: "error",
          responseTimeMs,
          service: "gbp",
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "gbp_search_keywords",
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
