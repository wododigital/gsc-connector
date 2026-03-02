/**
 * Tool: gbp_list_locations
 * Lists all Google Business Profile accounts and locations.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGbpAccessToken } from "./gbp-context.js";
import { listGbpAccounts, listGbpLocations, GbpApiError } from "../../../lib/gbp/api.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";
import { config } from "../../../config/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerGbpListLocationsTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "gbp_list_locations",
    "List all Google Business Profile accounts and their locations (business listings). Returns location names needed for other GBP tools.",
    {},
    async () => {
      const startTime = Date.now();
      try {
        const accessToken = await getGbpAccessToken(user.userId);
        const accounts = await listGbpAccounts(accessToken);

        const result: Array<{
          accountName: string;
          accountId: string;
          type: string;
          locations: Array<{
            name: string;
            title: string;
            address: string;
            phone?: string;
            website?: string;
            category?: string;
          }>;
        }> = [];

        for (const account of accounts) {
          const locations = await listGbpLocations(accessToken, account.name);
          result.push({
            accountName: account.accountName,
            accountId: account.name,
            type: account.type,
            locations: locations.map((loc) => {
              const addr = loc.storefrontAddress;
              const addressParts = [
                ...(addr?.addressLines ?? []),
                addr?.locality,
                addr?.administrativeArea,
                addr?.regionCode,
              ].filter(Boolean);

              return {
                name: `${account.name}/${loc.name}`,
                title: loc.title,
                address: addressParts.join(", "),
                phone: loc.phoneNumbers?.primaryPhone,
                website: loc.websiteUri,
                category: loc.categories?.primaryCategory?.displayName,
              };
            }),
          });
        }

        const totalLocations = result.reduce((s, a) => s + a.locations.length, 0);

        logToolCall({
          userId: user.userId,
          toolName: "gbp_list_locations",
          siteUrl: "gbp",
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
                    total_accounts: accounts.length,
                    total_locations: totalLocations,
                    accounts: result,
                    tip: 'Use the "name" field from each location as the location_name parameter in other GBP tools.',
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
            : "Failed to list GBP locations";

        logToolCall({
          userId: user.userId,
          toolName: "gbp_list_locations",
          siteUrl: "gbp",
          source: user.source,
          status: "error",
          responseTimeMs,
          service: "gbp",
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "gbp_list_locations",
          site_url: "gbp",
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
