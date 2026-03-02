/**
 * Tool: gbp_get_posts
 * Fetches local posts for a GBP location.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGbpAccessToken } from "./gbp-context.js";
import { getGbpPosts, GbpApiError } from "../../../lib/gbp/api.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";
import { config } from "../../../config/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerGbpGetPostsTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "gbp_get_posts",
    "Get local posts published on a Google Business Profile location (offers, events, updates, products).",
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
        .max(20)
        .default(10)
        .describe("Number of posts to return (default 10, max 20)"),
    },
    async (params) => {
      const startTime = Date.now();
      try {
        const accessToken = await getGbpAccessToken(user.userId);
        const rawPosts = await getGbpPosts(
          accessToken,
          params.location_name,
          params.page_size
        );

        type RawPost = {
          name?: string;
          languageCode?: string;
          summary?: string;
          callToAction?: { actionType?: string; url?: string };
          createTime?: string;
          updateTime?: string;
          state?: string;
          media?: Array<{ mediaFormat?: string; sourceUrl?: string }>;
          topicType?: string;
          event?: { title?: string; schedule?: { startDate?: unknown; endDate?: unknown } };
          offer?: { couponCode?: string; redeemOnlineUrl?: string; termsConditions?: string };
        };

        const posts = (rawPosts as RawPost[]).map((p) => ({
          name: p.name,
          type: p.topicType ?? "STANDARD",
          state: p.state,
          summary: p.summary,
          call_to_action: p.callToAction
            ? { type: p.callToAction.actionType, url: p.callToAction.url }
            : null,
          event: p.event
            ? { title: p.event.title, schedule: p.event.schedule }
            : null,
          offer: p.offer
            ? {
                coupon_code: p.offer.couponCode,
                redeem_url: p.offer.redeemOnlineUrl,
                terms: p.offer.termsConditions,
              }
            : null,
          media_count: p.media?.length ?? 0,
          created: p.createTime,
          updated: p.updateTime,
        }));

        logToolCall({
          userId: user.userId,
          toolName: "gbp_get_posts",
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
                    post_count: posts.length,
                    posts,
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
            : "Failed to fetch GBP posts";

        logToolCall({
          userId: user.userId,
          toolName: "gbp_get_posts",
          siteUrl: params.location_name,
          source: user.source,
          status: "error",
          responseTimeMs,
          service: "gbp",
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "gbp_get_posts",
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
