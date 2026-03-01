/**
 * Tools: list_sites, add_site, delete_site
 * All site management MCP tools.
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGscContext, getGscContextBySiteUrl } from "../helpers/gsc-client.js";
import { listSites, addSite, deleteSite } from "../../lib/google-api.js";
import { AppError } from "../../types/index.js";
import { logToolCall } from "../../lib/usage-logger.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

const propertyUrlParam = z
  .string()
  .optional()
  .describe(
    "Your authenticated GSC property to use for this request (e.g., 'https://example.com/'). Defaults to your primary property. Use list_my_properties to see available options."
  );

// ----------------------------------------------------------------
// Tool: list_sites
// ----------------------------------------------------------------
export function registerListSitesTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "list_sites",
    "List all sites you have access to in Google Search Console",
    { property_url: propertyUrlParam },
    async (params) => {
      const startTime = Date.now();
      let siteUrl = params.property_url || "unknown";
      try {
        const ctx = params.property_url
          ? await getGscContextBySiteUrl(user.userId, params.property_url)
          : await getGscContext(user.userId, user.propertyId);
        siteUrl = ctx.siteUrl;

        const result = await listSites(ctx.accessToken);

        logToolCall({ userId: user.userId, toolName: "list_sites", siteUrl: ctx.siteUrl, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    sites: result.siteEntry || [],
                    count: result.siteEntry?.length || 0,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logToolCall({ userId: user.userId, toolName: "list_sites", siteUrl, source: user.source, status: "error", responseTimeMs: Date.now() - startTime }).catch(() => undefined);
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to list sites";
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
// Tool: add_site  (WRITE operation)
// ----------------------------------------------------------------
export function registerAddSiteTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "add_site",
    "Add a new site to Google Search Console (WRITE operation - requires verification afterwards)",
    {
      site_url: z
        .string()
        .describe(
          "The URL of the site to add (e.g., https://example.com/ or sc-domain:example.com)"
        ),
      property_url: propertyUrlParam,
    },
    async (params) => {
      const startTime = Date.now();
      let siteUrl = params.property_url || "unknown";
      try {
        const ctx = params.property_url
          ? await getGscContextBySiteUrl(user.userId, params.property_url)
          : await getGscContext(user.userId, user.propertyId);
        siteUrl = ctx.siteUrl;

        await addSite(ctx.accessToken, params.site_url);

        logToolCall({ userId: user.userId, toolName: "add_site", siteUrl: ctx.siteUrl, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    addedSite: params.site_url,
                    message:
                      "Site added successfully. You will need to verify ownership in Google Search Console.",
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logToolCall({ userId: user.userId, toolName: "add_site", siteUrl, source: user.source, status: "error", responseTimeMs: Date.now() - startTime }).catch(() => undefined);
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to add site";
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
// Tool: delete_site  (DESTRUCTIVE operation)
// ----------------------------------------------------------------
export function registerDeleteSiteTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "delete_site",
    "Remove a site from Google Search Console (DESTRUCTIVE - this cannot be undone)",
    {
      site_url: z
        .string()
        .describe("The URL of the site to remove"),
      property_url: propertyUrlParam,
    },
    async (params) => {
      const startTime = Date.now();
      let siteUrl = params.property_url || "unknown";
      try {
        const ctx = params.property_url
          ? await getGscContextBySiteUrl(user.userId, params.property_url)
          : await getGscContext(user.userId, user.propertyId);
        siteUrl = ctx.siteUrl;

        await deleteSite(ctx.accessToken, params.site_url);

        logToolCall({ userId: user.userId, toolName: "delete_site", siteUrl: ctx.siteUrl, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    deletedSite: params.site_url,
                    message: "Site removed from Google Search Console successfully",
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logToolCall({ userId: user.userId, toolName: "delete_site", siteUrl, source: user.source, status: "error", responseTimeMs: Date.now() - startTime }).catch(() => undefined);
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to delete site";
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
