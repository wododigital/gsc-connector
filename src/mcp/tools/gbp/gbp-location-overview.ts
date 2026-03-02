/**
 * Tool: gbp_location_overview
 * Combined summary: location info + 30-day performance + recent reviews.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGbpAccessToken } from "./gbp-context.js";
import {
  listGbpAccounts,
  listGbpLocations,
  getGbpReviews,
  getGbpPerformance,
  GbpApiError,
} from "../../../lib/gbp/api.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";
import { config } from "../../../config/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerGbpLocationOverviewTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "gbp_location_overview",
    "Get a complete overview of a GBP location: business details, 30-day performance metrics, and recent reviews summary. Best starting point for local SEO analysis.",
    {
      location_name: z
        .string()
        .max(500)
        .describe(
          'Full location path from gbp_list_locations (e.g., "accounts/123456/locations/789012"). Call gbp_list_locations first if you do not have this.'
        ),
    },
    async (params) => {
      const startTime = Date.now();
      try {
        const accessToken = await getGbpAccessToken(user.userId);

        // Calculate 30-day window
        const endDate = new Date().toISOString().slice(0, 10);
        const startDt = new Date();
        startDt.setDate(startDt.getDate() - 30);
        const startDate = startDt.toISOString().slice(0, 10);

        // Fetch performance and reviews in parallel
        const [perfRaw, reviewData] = await Promise.allSettled([
          getGbpPerformance(accessToken, params.location_name, startDate, endDate),
          getGbpReviews(accessToken, params.location_name, 5),
        ]);

        // Parse performance totals
        type MetricEntry = {
          metric: string;
          dailySubEntityData?: Array<{
            timeSeries?: { datedValues?: Array<{ value?: string }> };
          }>;
        };
        const perfTotals: Record<string, number> = {};
        if (perfRaw.status === "fulfilled") {
          const metricResults = (
            perfRaw.value as { multiDailyMetricTimeSeries?: MetricEntry[] }
          ).multiDailyMetricTimeSeries ?? [];

          for (const entry of metricResults) {
            let total = 0;
            for (const sub of entry.dailySubEntityData ?? []) {
              for (const dv of sub.timeSeries?.datedValues ?? []) {
                total += parseInt(dv.value ?? "0", 10);
              }
            }
            const shortName = entry.metric
              .replace("BUSINESS_IMPRESSIONS_", "impressions_")
              .toLowerCase();
            perfTotals[shortName] = total;
          }
        }

        // Summarize impressions
        const totalImpressions = Object.entries(perfTotals)
          .filter(([k]) => k.startsWith("impressions_"))
          .reduce((s, [, v]) => s + v, 0);

        // Review summary
        let reviewSummary: {
          total_reviews: number;
          average_rating: number;
          recent_5: Array<{ rating: string; date: string; has_reply: boolean }>;
        } | null = null;

        if (reviewData.status === "fulfilled") {
          const { reviews, totalReviewCount, averageRating } = reviewData.value;
          reviewSummary = {
            total_reviews: totalReviewCount,
            average_rating: averageRating,
            recent_5: reviews.slice(0, 5).map((r) => ({
              rating: r.starRating,
              date: r.createTime,
              has_reply: !!r.reviewReply,
            })),
          };
        }

        // Try to get location details from the listing
        let locationDetails: {
          title: string;
          address: string;
          phone?: string;
          website?: string;
          category?: string;
        } | null = null;

        try {
          // Extract accountId from location path "accounts/{id}/locations/{id}"
          const accountMatch = params.location_name.match(/^(accounts\/[^/]+)/);
          if (accountMatch) {
            const locations = await listGbpLocations(accessToken, accountMatch[1]);
            const locIdMatch = params.location_name.match(/locations\/([^/]+)$/);
            const locId = locIdMatch ? locIdMatch[1] : null;
            const loc = locId
              ? locations.find((l) => l.name.endsWith(locId))
              : locations[0];

            if (loc) {
              const addr = loc.storefrontAddress;
              const addressParts = [
                ...(addr?.addressLines ?? []),
                addr?.locality,
                addr?.administrativeArea,
                addr?.regionCode,
              ].filter(Boolean);
              locationDetails = {
                title: loc.title,
                address: addressParts.join(", "),
                phone: loc.phoneNumbers?.primaryPhone,
                website: loc.websiteUri,
                category: loc.categories?.primaryCategory?.displayName,
              };
            }
          }
        } catch {
          // Non-fatal - overview still useful without location details
        }

        logToolCall({
          userId: user.userId,
          toolName: "gbp_location_overview",
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
                    business_info: locationDetails,
                    performance_30_days: {
                      date_range: { start: startDate, end: endDate },
                      total_impressions: totalImpressions,
                      metrics: perfTotals,
                      performance_available: perfRaw.status === "fulfilled",
                    },
                    reviews: reviewSummary,
                    next_steps: [
                      "Use gbp_get_performance for detailed daily metrics",
                      "Use gbp_search_keywords for keyword impressions",
                      "Use gbp_get_reviews for full review list",
                      "Use gbp_get_posts to see published posts",
                    ],
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
            : "Failed to fetch GBP location overview";

        logToolCall({
          userId: user.userId,
          toolName: "gbp_location_overview",
          siteUrl: params.location_name,
          source: user.source,
          status: "error",
          responseTimeMs,
          service: "gbp",
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "gbp_location_overview",
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
