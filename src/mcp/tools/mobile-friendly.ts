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

interface UserContext {
  userId: string;
  propertyId: string;
}

export function registerMobileFriendlyTool(
  server: McpServer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _user: UserContext
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
      try {
        const result = await runMobileFriendlyTest(params.url);

        const isMobileFriendly =
          result.mobileFriendliness === "MOBILE_FRIENDLY";

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
        const msg =
          error instanceof AppError
            ? error.message
            : "Failed to run mobile-friendly test";
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
