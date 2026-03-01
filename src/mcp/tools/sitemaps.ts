/**
 * Tools: list_sitemaps, get_sitemap, submit_sitemap, delete_sitemap
 * All sitemap-related MCP tools in one file.
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGscContext, getGscContextBySiteUrl } from "../helpers/gsc-client.js";
import {
  listSitemaps,
  getSitemap,
  submitSitemap,
  deleteSitemap,
} from "../../lib/google-api.js";
import { AppError } from "../../types/index.js";
import { logToolCall } from "../../lib/usage-logger.js";
import { logMcpError } from "../../lib/error-logger.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

const siteUrlParam = z
  .string()
  .max(500)
  .optional()
  .describe(
    "GSC property to query (e.g., 'https://example.com/'). Defaults to your primary property. Use list_my_properties to see all available properties."
  );

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
    { site_url: siteUrlParam },
    async (params) => {
      const startTime = Date.now();
      let siteUrl = params.site_url || "unknown";
      try {
        const ctx = params.site_url
          ? await getGscContextBySiteUrl(user.userId, params.site_url)
          : await getGscContext(user.userId, user.propertyId);
        siteUrl = ctx.siteUrl;

        const result = await listSitemaps(ctx.accessToken, ctx.siteUrl);

        logToolCall({ userId: user.userId, toolName: "list_sitemaps", siteUrl: ctx.siteUrl, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

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
        const responseTimeMs = Date.now() - startTime;
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to list sitemaps";
        logToolCall({ userId: user.userId, toolName: "list_sitemaps", siteUrl, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "list_sitemaps", site_url: siteUrl, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
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
        .max(2000)
        .url()
        .describe(
          "The full URL of the sitemap (e.g., https://example.com/sitemap.xml)"
        ),
      site_url: siteUrlParam,
    },
    async (params) => {
      const startTime = Date.now();
      let siteUrl = params.site_url || "unknown";
      try {
        const ctx = params.site_url
          ? await getGscContextBySiteUrl(user.userId, params.site_url)
          : await getGscContext(user.userId, user.propertyId);
        siteUrl = ctx.siteUrl;

        const result = await getSitemap(
          ctx.accessToken,
          ctx.siteUrl,
          params.sitemap_url
        );

        logToolCall({ userId: user.userId, toolName: "get_sitemap", siteUrl: ctx.siteUrl, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

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
        const responseTimeMs = Date.now() - startTime;
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to get sitemap details";
        logToolCall({ userId: user.userId, toolName: "get_sitemap", siteUrl, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "get_sitemap", site_url: siteUrl, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
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
        .max(2000)
        .url()
        .describe(
          "The full URL of the sitemap to submit (e.g., https://example.com/sitemap.xml)"
        ),
      site_url: siteUrlParam,
    },
    async (params) => {
      const startTime = Date.now();
      let siteUrl = params.site_url || "unknown";
      try {
        const ctx = params.site_url
          ? await getGscContextBySiteUrl(user.userId, params.site_url)
          : await getGscContext(user.userId, user.propertyId);
        siteUrl = ctx.siteUrl;

        await submitSitemap(ctx.accessToken, ctx.siteUrl, params.sitemap_url);

        logToolCall({ userId: user.userId, toolName: "submit_sitemap", siteUrl: ctx.siteUrl, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

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
        const responseTimeMs = Date.now() - startTime;
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to submit sitemap";
        logToolCall({ userId: user.userId, toolName: "submit_sitemap", siteUrl, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "submit_sitemap", site_url: siteUrl, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
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
        .max(2000)
        .url()
        .describe("The full URL of the sitemap to delete"),
      site_url: siteUrlParam,
    },
    async (params) => {
      const startTime = Date.now();
      let siteUrl = params.site_url || "unknown";
      try {
        const ctx = params.site_url
          ? await getGscContextBySiteUrl(user.userId, params.site_url)
          : await getGscContext(user.userId, user.propertyId);
        siteUrl = ctx.siteUrl;

        await deleteSitemap(ctx.accessToken, ctx.siteUrl, params.sitemap_url);

        logToolCall({ userId: user.userId, toolName: "delete_sitemap", siteUrl: ctx.siteUrl, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

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
        const responseTimeMs = Date.now() - startTime;
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to delete sitemap";
        logToolCall({ userId: user.userId, toolName: "delete_sitemap", siteUrl, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "delete_sitemap", site_url: siteUrl, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
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
