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

// Default month range: trailing 3 calendar months ending with the current
// month. Search keyword data is monthly so 3 months gives a usable trend
// window without burning through the per-day quota.
function defaultMonthRange(): { start: { year: number; month: number }; end: { year: number; month: number } } {
  const now = new Date();
  const endYear = now.getUTCFullYear();
  const endMonth = now.getUTCMonth() + 1;
  const startCandidate = new Date(Date.UTC(endYear, now.getUTCMonth() - 2, 1));
  return {
    start: { year: startCandidate.getUTCFullYear(), month: startCandidate.getUTCMonth() + 1 },
    end: { year: endYear, month: endMonth },
  };
}

const MONTH_REGEX = /^(\d{4})-(\d{2})$/;

function parseMonth(s: string | undefined, fallback: { year: number; month: number }): { year: number; month: number } {
  if (!s) return fallback;
  const m = s.match(MONTH_REGEX);
  if (!m) return fallback;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (month < 1 || month > 12) return fallback;
  return { year, month };
}

export function registerGbpSearchKeywordsTool(server: McpServer, user: UserContext): void {
  const defaults = defaultMonthRange();
  const defaultStartStr = `${defaults.start.year}-${String(defaults.start.month).padStart(2, "0")}`;
  const defaultEndStr = `${defaults.end.year}-${String(defaults.end.month).padStart(2, "0")}`;

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
      start_month: z
        .string()
        .regex(MONTH_REGEX)
        .default(defaultStartStr)
        .describe("First month to include, YYYY-MM format (default: 2 months before the current month)"),
      end_month: z
        .string()
        .regex(MONTH_REGEX)
        .default(defaultEndStr)
        .describe("Last month to include, YYYY-MM format (default: current month)"),
    },
    async (params) => {
      const startTime = Date.now();
      try {
        const accessToken = await getGbpAccessToken(user.userId);
        const startMonth = parseMonth(params.start_month, defaults.start);
        const endMonth = parseMonth(params.end_month, defaults.end);
        const raw = await getGbpSearchKeywords(
          accessToken,
          params.location_name,
          startMonth,
          endMonth
        );

        const keywords = (raw.searchKeywordsCounts ?? [])
          .map((k) => ({
            keyword: k.searchKeyword ?? "",
            impressions: parseInt(k.insightsValue?.value ?? "0", 10),
            is_approximate: Boolean(k.insightsValue?.threshold),
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
                    month_range: { start: params.start_month, end: params.end_month },
                    keyword_count: keywords.length,
                    keywords,
                    note: "Impressions are aggregated across the selected month range. Values marked is_approximate are below Google's reporting threshold.",
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
