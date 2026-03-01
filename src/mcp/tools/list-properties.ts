/**
 * Tool: list_my_properties
 * Returns all active GSC properties connected to the authenticated user's account.
 * Useful for discovering which site_url values are available for other tool calls.
 * Owned by: Coder-MCP agent
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import db from "../../lib/db.js";
import { AppError } from "../../types/index.js";
import { logToolCall } from "../../lib/usage-logger.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerListMyPropertiesTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "list_my_properties",
    "List all your connected Google Search Console properties. Use the site_url values from this list to query specific properties with other tools.",
    {},
    async () => {
      const startTime = Date.now();
      try {
        const properties = await db.gscProperty.findMany({
          where: { userId: user.userId, isActive: true },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            siteUrl: true,
            permissionLevel: true,
            createdAt: true,
          },
        });

        logToolCall({ userId: user.userId, toolName: "list_my_properties", siteUrl: "N/A", source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    properties: properties.map((p) => ({
                      site_url: p.siteUrl,
                      permission: p.permissionLevel
                        .replace("site", "")
                        .toLowerCase(),
                      connected_at: p.createdAt.toISOString().split("T")[0],
                    })),
                    count: properties.length,
                    hint: "Pass site_url to any tool to query a specific property",
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logToolCall({ userId: user.userId, toolName: "list_my_properties", siteUrl: "N/A", source: user.source, status: "error", responseTimeMs: Date.now() - startTime }).catch(() => undefined);
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to list properties";
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
