/**
 * Tool: inspect_url
 * Checks the indexing and mobile usability status of a URL in Google Search Console.
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGscContext, getGscContextBySiteUrl } from "../helpers/gsc-client.js";
import { inspectUrl } from "../../lib/google-api.js";
import { AppError } from "../../types/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
}

export function registerUrlInspectionTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "inspect_url",
    "Check the indexing status of a URL in Google Search Console",
    {
      url: z
        .string()
        .url()
        .describe("The full URL to inspect (must belong to your verified property)"),
      site_url: z
        .string()
        .optional()
        .describe(
          "GSC property that owns this URL (e.g., 'https://example.com/'). Defaults to your primary property. Use list_my_properties to see all available properties."
        ),
    },
    async (params) => {
      try {
        const ctx = params.site_url
          ? await getGscContextBySiteUrl(user.userId, params.site_url)
          : await getGscContext(user.userId, user.propertyId);

        const result = await inspectUrl(
          ctx.accessToken,
          params.url,
          ctx.siteUrl
        );

        const inspection = result;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    site: ctx.siteUrl,
                    inspectedUrl: params.url,
                    indexStatus: inspection.indexStatusResult ?? null,
                    mobileUsability: inspection.mobileUsabilityResult ?? null,
                    richResults: inspection.richResultsResult ?? null,
                    inspectionResultLink:
                      inspection.inspectionResultLink ?? null,
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
            : "Failed to inspect URL";
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
