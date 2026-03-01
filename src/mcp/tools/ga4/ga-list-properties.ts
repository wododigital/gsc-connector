/**
 * Tool: ga_list_properties
 * List all active GA4 properties for the authenticated user.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import db from "../../../lib/db.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerGaListPropertiesTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "ga_list_properties",
    "List all your connected Google Analytics 4 properties. Use the property_id values from this list to query other GA4 tools.",
    {},
    async () => {
      const startTime = Date.now();
      try {
        const properties = await db.ga4Property.findMany({
          where: { userId: user.userId, isActive: true },
          orderBy: { createdAt: "asc" },
          select: {
            propertyId: true,
            displayName: true,
            accountName: true,
            createdAt: true,
          },
        });

        logToolCall({
          userId: user.userId,
          toolName: "ga_list_properties",
          siteUrl: "N/A",
          source: user.source,
          status: "success",
          responseTimeMs: Date.now() - startTime,
          service: "ga4",
        }).catch(() => undefined);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    properties: properties.map((p) => ({
                      property_id: p.propertyId,
                      display_name: p.displayName,
                      account_name: p.accountName ?? undefined,
                      connected_at: p.createdAt.toISOString().split("T")[0],
                    })),
                    count: properties.length,
                    hint: "Pass property_id to any ga_* tool to query a specific GA4 property.",
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
            : "Failed to list GA4 properties";
        logToolCall({
          userId: user.userId,
          toolName: "ga_list_properties",
          siteUrl: "N/A",
          source: user.source,
          status: "error",
          responseTimeMs,
          service: "ga4",
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "ga_list_properties",
          site_url: "N/A",
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
