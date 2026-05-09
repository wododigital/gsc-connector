/**
 * Tool: get_report_template
 * Returns the full prompt template for a specific report, with the user's
 * brand profile values injected into {{brand.*}} placeholders. The AI then
 * reads this prompt and follows its instructions (asks the clarifying
 * questions, then generates the HTML report).
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import db from "../../lib/db.js";
import { logToolCall } from "../../lib/usage-logger.js";
import { logMcpError } from "../../lib/error-logger.js";
import { injectBrandProfile, resolveBrandValues } from "../../lib/brand-injector.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerGetReportTemplateTool(server: McpServer, user: UserContext): void {
  server.tool(
    "get_report_template",
    "Get the full prompt template for a specific report. Returns the complete prompt with clarifying questions and instructions, and the user's brand profile already injected. Call this after the user selects a template from list_report_templates.",
    {
      template_id: z.string().min(1).max(64).describe("The ID of the template to retrieve"),
    },
    async ({ template_id }) => {
      const startTime = Date.now();
      try {
        const [systemPrompt, userPrompt, brand] = await Promise.all([
          db.promptTemplate.findUnique({ where: { id: template_id } }),
          db.userPrompt.findUnique({ where: { id: template_id } }),
          db.brandProfile.findUnique({ where: { userId: user.userId } }),
        ]);

        // Reject if template doesn't exist OR is a user prompt belonging to someone else.
        const tpl = systemPrompt && systemPrompt.isActive ? systemPrompt : userPrompt;
        const isUserOwnedByOther = userPrompt && userPrompt.userId !== user.userId;
        if (!tpl || isUserOwnedByOther) {
          throw new Error(`Template ${template_id} not found`);
        }

        const injectedBody = injectBrandProfile(tpl.body, brand);
        const brandValues = resolveBrandValues(brand);

        logToolCall({
          userId: user.userId,
          toolName: "get_report_template",
          siteUrl: "N/A",
          source: user.source,
          status: "success",
          responseTimeMs: Date.now() - startTime,
        }).catch(() => undefined);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    id: tpl.id,
                    title: tpl.title,
                    description: tpl.description,
                    category: tpl.category,
                    required_connections: tpl.requiredConnections,
                    questions: tpl.questions,
                    brand_profile: {
                      ...brandValues,
                      is_user_brand: Boolean(brand?.isApproved),
                    },
                    prompt: injectedBody,
                    instructions:
                      "Read the 'prompt' field carefully. It tells you what clarifying questions to ask " +
                      "the user before generating the report. Ask those questions, wait for answers, then " +
                      "generate the report as a self-contained HTML file using the brand profile included in this response.",
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
        const msg = error instanceof Error ? error.message : "Failed to load template";
        logToolCall({
          userId: user.userId,
          toolName: "get_report_template",
          siteUrl: "N/A",
          source: user.source,
          status: "error",
          responseTimeMs,
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "get_report_template",
          site_url: "N/A",
          user_id: user.userId,
          status: "error",
          error_message: msg,
          stack: error instanceof Error ? error.stack : undefined,
          response_time_ms: responseTimeMs,
        }).catch(() => undefined);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ success: false, error: msg }, null, 2) },
          ],
          isError: true,
        };
      }
    }
  );
}
