/**
 * Tools: list_sitemaps, get_sitemap, submit_sitemap, delete_sitemap
 * All sitemap-related MCP tools in one file.
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGscContext } from "../helpers/gsc-client.js";
import {
  listSitemaps,
  getSitemap,
  submitSitemap,
  deleteSitemap,
} from "../../lib/google-api.js";
import { AppError } from "../../types/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
}

// ----------------------------------------------------------------
// Tool: list_sitemaps
// ----------------------------------------------------------------
export function registerListSitemapsTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "list_sitemaps",
    "List all sitemaps submitted for your site",
    {},
    async () => {
      try {
        const ctx = await getGscContext(user.userId, user.propertyId);
        const result = await listSitemaps(ctx.accessToken, ctx.siteUrl);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    site: ctx.siteUrl,
                    sitemaps: result.sitemap || [],
                    count: result.sitemap?.length || 0,
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
            : "Failed to list sitemaps";
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

// ----------------------------------------------------------------
// Tool: get_sitemap
// ----------------------------------------------------------------
export function registerGetSitemapTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "get_sitemap",
    "Get details about a specific sitemap",
    {
      sitemap_url: z
        .string()
        .url()
        .describe(
          "The full URL of the sitemap (e.g., https://example.com/sitemap.xml)"
        ),
    },
    async (params) => {
      try {
        const ctx = await getGscContext(user.userId, user.propertyId);
        const result = await getSitemap(
          ctx.accessToken,
          ctx.siteUrl,
          params.sitemap_url
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
                    sitemap: result,
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
            : "Failed to get sitemap details";
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

// ----------------------------------------------------------------
// Tool: submit_sitemap  (WRITE operation)
// ----------------------------------------------------------------
export function registerSubmitSitemapTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "submit_sitemap",
    "Submit a new sitemap to Google Search Console (WRITE operation - modifies your GSC account)",
    {
      sitemap_url: z
        .string()
        .url()
        .describe(
          "The full URL of the sitemap to submit (e.g., https://example.com/sitemap.xml)"
        ),
    },
    async (params) => {
      try {
        const ctx = await getGscContext(user.userId, user.propertyId);
        await submitSitemap(ctx.accessToken, ctx.siteUrl, params.sitemap_url);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    site: ctx.siteUrl,
                    submittedSitemap: params.sitemap_url,
                    message: "Sitemap submitted successfully",
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
            : "Failed to submit sitemap";
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

// ----------------------------------------------------------------
// Tool: delete_sitemap  (DESTRUCTIVE operation)
// ----------------------------------------------------------------
export function registerDeleteSitemapTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "delete_sitemap",
    "Remove a sitemap from Google Search Console (DESTRUCTIVE - this cannot be undone)",
    {
      sitemap_url: z
        .string()
        .url()
        .describe("The full URL of the sitemap to delete"),
    },
    async (params) => {
      try {
        const ctx = await getGscContext(user.userId, user.propertyId);
        await deleteSitemap(ctx.accessToken, ctx.siteUrl, params.sitemap_url);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    site: ctx.siteUrl,
                    deletedSitemap: params.sitemap_url,
                    message: "Sitemap deleted successfully",
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
            : "Failed to delete sitemap";
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
