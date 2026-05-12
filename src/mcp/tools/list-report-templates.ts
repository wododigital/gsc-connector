/**
 * Tool: list_report_templates
 * Returns all available report prompt templates (system + user) - just the
 * metadata, not the full prompt body. The AI uses this to surface a menu of
 * report types to the user when they ask "show me available reports".
 * Owned by: Coder-MCP agent
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import db from "../../lib/db.js";
import { logToolCall } from "../../lib/usage-logger.js";
import { logMcpError } from "../../lib/error-logger.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

export function registerListReportTemplatesTool(server: McpServer, user: UserContext): void {
  server.tool(
    "list_report_templates",
    "List all available report prompt templates. Returns template names and short descriptions. The user can then select a template to generate a report.",
    {
      category: z
        .string()
        .max(40)
        .optional()
        .describe("Optional filter by category: seo-report, traffic-analysis, aeo, technical-seo, gbp-report, competitor"),
      search: z
        .string()
        .max(120)
        .optional()
        .describe("Optional search query to filter templates by keyword"),
    },
    async ({ category, search }) => {
      const startTime = Date.now();
      try {
        const [systemPrompts, userPrompts, deactivatedStates] = await Promise.all([
          db.promptTemplate.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          }),
          db.userPrompt.findMany({
            where: { userId: user.userId, isActive: true },
            orderBy: { createdAt: "desc" },
          }),
          db.userPromptTemplateState.findMany({
            where: { userId: user.userId, isActive: false },
            select: { promptTemplateId: true },
          }),
        ]);

        // Skip admin prompts that this user has deactivated for themselves.
        const userDeactivated = new Set(deactivatedStates.map((s) => s.promptTemplateId));
        const activeSystemPrompts = systemPrompts.filter((p) => !userDeactivated.has(p.id));

        const merged = [
          ...activeSystemPrompts.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            category: p.category,
            requiredConnections: p.requiredConnections as unknown as string[],
            semanticTags: p.semanticTags as unknown as string[],
            source: "system" as const,
          })),
          ...userPrompts.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            category: p.category,
            requiredConnections: p.requiredConnections as unknown as string[],
            semanticTags: p.semanticTags as unknown as string[],
            source: "user" as const,
          })),
        ];

        const filtered = merged.filter((t) => {
          if (category && t.category !== category) return false;
          if (search) {
            const needle = search.toLowerCase();
            const haystack = [t.title, t.description, t.category, ...(t.semanticTags ?? [])]
              .join(" ")
              .toLowerCase();
            if (!haystack.includes(needle)) return false;
          }
          return true;
        });

        logToolCall({
          userId: user.userId,
          toolName: "list_report_templates",
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
                    count: filtered.length,
                    templates: filtered.map((t) => ({
                      id: t.id,
                      title: t.title,
                      description: t.description,
                      category: t.category,
                      required_connections: t.requiredConnections,
                      source: t.source,
                    })),
                    hint: "Call get_report_template with a template_id to get the full prompt and brand profile.",
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
        const msg = error instanceof Error ? error.message : "Failed to list templates";
        logToolCall({
          userId: user.userId,
          toolName: "list_report_templates",
          siteUrl: "N/A",
          source: user.source,
          status: "error",
          responseTimeMs,
        }).catch(() => undefined);
        logMcpError({
          timestamp: new Date().toISOString(),
          tool: "list_report_templates",
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
