/**
 * Tool: run_mobile_friendly_test
 * Tests a URL for mobile-friendliness using Google's URL Testing Tools API.
 * Note: This API uses a Google API key, NOT an OAuth access token.
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runMobileFriendlyTest } from "../../lib/google-api.js";
import { AppError } from "../../types/index.js";
import { logToolCall } from "../../lib/usage-logger.js";
import { logMcpError } from "../../lib/error-logger.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerMobileFriendlyTool(
  server: McpServer,
  user: UserContext
): void {
  server.tool(
    "run_mobile_friendly_test",
    "Test if a URL is mobile-friendly according to Google",
    {
      url: z
        .string()
        .url()
        .describe("The full URL to test for mobile-friendliness"),
    },
    async (params) => {
      const startTime = Date.now();
      try {
        const result = await runMobileFriendlyTest(params.url);

        const isMobileFriendly =
          result.mobileFriendliness === "MOBILE_FRIENDLY";

        logToolCall({ userId: user.userId, toolName: "run_mobile_friendly_test", siteUrl: params.url, source: user.source, status: "success", responseTimeMs: Date.now() - startTime }).catch(() => undefined);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    url: params.url,
                    mobileFriendly: isMobileFriendly,
                    verdict: result.mobileFriendliness ?? "UNKNOWN",
                    testStatus: result.testStatus ?? null,
                    issues: result.mobileFriendlyIssues || [],
                    issueCount: result.mobileFriendlyIssues?.length || 0,
                    resourceIssues: result.resourceIssues || [],
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
            : "Failed to run mobile-friendly test";
        logToolCall({ userId: user.userId, toolName: "run_mobile_friendly_test", siteUrl: params.url, source: user.source, status: "error", responseTimeMs }).catch(() => undefined);
        logMcpError({ timestamp: new Date().toISOString(), tool: "run_mobile_friendly_test", site_url: params.url, user_id: user.userId, status: "error", error_message: msg, stack: error instanceof Error ? error.stack : undefined, response_time_ms: responseTimeMs }).catch(() => undefined);
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
