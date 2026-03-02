/**
 * Tool: gbp_get_reviews
 * Fetches reviews for a Google Business Profile location.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGbpAccessToken } from "./gbp-context.js";
import { getGbpReviews, GbpApiError } from "../../../lib/gbp/api.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";
import { config } from "../../../config/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerGbpGetReviewsTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "gbp_get_reviews",
    "Get customer reviews for a Google Business Profile location, including star ratings, comments, and reply status.",
    {
      location_name: z
        .string()
        .max(500)
        .describe(
          'Full location path from gbp_list_locations (e.g., "accounts/123456/locations/789012")'
        ),
      page_size: z
        .number()
        .min(1)
        .max(50)
        .default(20)
        .describe("Number of reviews to return (default 20, max 50)"),
    },
    async (params) => {
      const startTime = Date.now();
      try {
        const accessToken = await getGbpAccessToken(user.userId);
        const { reviews, totalReviewCount, averageRating } = await getGbpReviews(
          accessToken,
          params.location_name,
          params.page_size
        );

        const formatted = reviews.map((r) => ({
          reviewer: r.reviewer.displayName,
          rating: r.starRating,
          comment: r.comment ?? "",
          date: r.createTime,
          has_reply: !!r.reviewReply,
          reply: r.reviewReply?.comment,
        }));

        const starCounts = { FIVE: 0, FOUR: 0, THREE: 0, TWO: 0, ONE: 0 };
        for (const r of reviews) {
          const key = r.starRating as keyof typeof starCounts;
          if (key in starCounts) starCounts[key]++;
        }

        logToolCall({
          userId: user.userId,
          toolName: "gbp_get_reviews",
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
                    total_reviews: totalReviewCount,
                    average_rating: averageRating,
                    star_distribution: starCounts,
                    reviews_returned: formatted.length,
                    reviews: formatted,
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
            : "Failed to fetch GBP reviews";

        logToolCall({
          userId: user.userId,
          toolName: "gbp_get_reviews",
          siteUrl: params.location_name,
          source: user.source,
          status: "error",
          responseTimeMs,
          service: "gbp",
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "gbp_get_reviews",
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
