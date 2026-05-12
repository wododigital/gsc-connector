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
        const [systemPrompt, userPrompt, brand, systemState] = await Promise.all([
          db.promptTemplate.findUnique({ where: { id: template_id } }),
          db.userPrompt.findUnique({ where: { id: template_id } }),
          db.brandProfile.findUnique({ where: { userId: user.userId } }),
          db.userPromptTemplateState.findUnique({
            where: {
              userId_promptTemplateId: {
                userId: user.userId,
                promptTemplateId: template_id,
              },
            },
          }),
        ]);

        // Reject if template doesn't exist, is a user prompt belonging to someone
        // else, is an inactive user prompt the owner has paused, or is a system
        // prompt that this user has deactivated for themselves.
        const tpl = systemPrompt && systemPrompt.isActive ? systemPrompt : userPrompt;
        const isUserOwnedByOther = userPrompt && userPrompt.userId !== user.userId;
        const isInactiveUserPrompt =
          userPrompt && userPrompt.userId === user.userId && !userPrompt.isActive;
        const isUserDeactivatedSystemPrompt =
          systemPrompt && systemState && !systemState.isActive;
        if (!tpl || isUserOwnedByOther || isInactiveUserPrompt || isUserDeactivatedSystemPrompt) {
          throw new Error(`Template ${template_id} not found`);
        }

        const brandValues = resolveBrandValues(brand);

        // Hard preamble that the AI must follow before generating anything.
        // No defaults are allowed: property, date range and output format must
        // come from the user explicitly. Without all three answered, the AI
        // is instructed to stop and ask, not to proceed with assumptions.
        const STOP_PREAMBLE = [
          "## STOP. READ THIS BEFORE GENERATING.",
          "",
          "You MUST collect answers to ALL of the following BEFORE you produce the report.",
          "Do NOT use defaults. Do NOT guess. If any answer is missing, ask for it and wait.",
          "",
          "1. **Output format** - choose ONE:",
          "   - `webpage` -> self-contained interactive HTML artifact (charts, tables, brand styles inline)",
          "   - `pdf`     -> print-ready HTML styled for letter/A4 with @media print rules; user will Save as PDF",
          "   - `excel`   -> structured workbook content. Output a fenced ```csv block for each sheet, plus a one-line header naming the sheet. No charts.",
          "2. **Property / site** - the GSC site, GA4 property or GBP location to query. Never assume.",
          "3. **Date range** - explicit start and end dates (or a named range like \"last 28 days\"). Never assume.",
          "",
          "If the user has not explicitly provided all three, STOP and ask for the missing pieces.",
          "Only after all three are answered may you proceed with the prompt below.",
          "",
          "---",
          "",
        ].join("\n");

        const injectedBody = STOP_PREAMBLE + injectBrandProfile(tpl.body, brand);

        // Format-specific guidance the AI should apply once the user picks a format.
        const formatGuidance = {
          webpage:
            "Render a single self-contained HTML artifact. Inline all CSS using the brand values " +
            "(background = brand.bgColor, text = brand.textColor, accent in header and footer only). " +
            "Include interactive elements where they add insight (tabs, sortable tables, simple SVG charts).",
          pdf:
            "Render print-ready HTML using the brand values. Add an @media print block that sets page " +
            "size to A4 with 18mm margins, hides any interactive UI, and forces accent colors with " +
            "-webkit-print-color-adjust: exact. Tell the user to use the browser Print dialog -> Save as PDF.",
          excel:
            "Output one fenced ```csv block per sheet. Above each block put a single line `# Sheet: <name>`. " +
            "Use the user's accent color in the recommendations section as commentary, not styling. No charts, " +
            "no HTML. The user will paste each block into a separate sheet.",
        };

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
                    mandatory_questions: [
                      {
                        key: "output_format",
                        prompt: "Which output format do you want: webpage, pdf, or excel?",
                        accepts: ["webpage", "pdf", "excel"],
                      },
                      {
                        key: "property",
                        prompt: "Which property / site / location should I query?",
                      },
                      {
                        key: "date_range",
                        prompt: "What date range should I use (explicit start and end, or a named range like 'last 28 days')?",
                      },
                    ],
                    brand_profile: {
                      ...brandValues,
                      is_user_brand: Boolean(brand?.isApproved),
                    },
                    format_guidance: formatGuidance,
                    prompt: injectedBody,
                    instructions:
                      "STRICT EXECUTION RULES:\n" +
                      "1. Do not generate the report yet. First confirm all three answers in `mandatory_questions`: output_format, property, and date_range. If any is missing, ask the user and wait.\n" +
                      "2. Never substitute defaults for the mandatory questions. If the user says 'whatever' or 'you decide', ask again with options.\n" +
                      "3. Also ask the template's own clarifying `questions` if they have not been answered.\n" +
                      "4. Once the user picks an output_format, apply the matching entry from `format_guidance` to control how the final output is rendered.\n" +
                      "5. Use the `brand_profile` values (colors, logo, website) for visual styling. Only the accent color should appear in the header, accent icons and footer; do not let it dominate the body.\n" +
                      "6. The `prompt` field contains a STOP preamble at the top - obey it verbatim before anything else.",
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
