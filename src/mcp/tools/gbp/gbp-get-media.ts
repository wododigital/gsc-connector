/**
 * Tool: gbp_get_media
 * Fetches media items (photos/videos) for a GBP location.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGbpAccessToken } from "./gbp-context.js";
import { getGbpMedia, GbpApiError } from "../../../lib/gbp/api.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";
import { config } from "../../../config/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerGbpGetMediaTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "gbp_get_media",
    "Get photos and videos associated with a Google Business Profile location.",
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
        .describe("Number of media items to return (default 10, max 20)"),
    },
    async (params) => {
      const startTime = Date.now();
      try {
        const accessToken = await getGbpAccessToken(user.userId);
        const rawMedia = await getGbpMedia(
          accessToken,
          params.location_name,
          params.page_size
        );

        type RawMedia = {
          name?: string;
          mediaFormat?: string;
          locationAssociation?: { category?: string };
          googleUrl?: string;
          thumbnailUrl?: string;
          createTime?: string;
          insights?: { viewCount?: string };
          attribution?: { profileName?: string };
          description?: string;
        };

        const items = (rawMedia as RawMedia[]).map((m) => ({
          name: m.name,
          format: m.mediaFormat,
          category: m.locationAssociation?.category,
          url: m.googleUrl,
          thumbnail: m.thumbnailUrl,
          description: m.description,
          view_count: m.insights?.viewCount
            ? parseInt(m.insights.viewCount, 10)
            : null,
          uploaded_by: m.attribution?.profileName ?? "owner",
          created: m.createTime,
        }));

        // Group by category
        const byCategory: Record<string, number> = {};
        for (const item of items) {
          const cat = item.category ?? "UNCATEGORIZED";
          byCategory[cat] = (byCategory[cat] ?? 0) + 1;
        }

        logToolCall({
          userId: user.userId,
          toolName: "gbp_get_media",
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
                    media_count: items.length,
                    by_category: byCategory,
                    media: items,
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
            : "Failed to fetch GBP media";

        logToolCall({
          userId: user.userId,
          toolName: "gbp_get_media",
          siteUrl: params.location_name,
          source: user.source,
          status: "error",
          responseTimeMs,
          service: "gbp",
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "gbp_get_media",
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
