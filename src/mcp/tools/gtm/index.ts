/**
 * Google Tag Manager MCP tools (read-only audit set).
 *
 * GATED: these tools are only registered for users with the "gtm" platform
 * entitlement (see createMcpServer), and every call re-checks the
 * entitlement because MCP sessions can outlive an admin revocation.
 *
 * Quota note: the GTM API's default quota is ~15 req/min per project.
 * All reads go through the shared cache/throttle in lib/gtm/api.ts.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listGtmAccounts,
  listGtmContainers,
  listGtmTags,
  listGtmTriggers,
  listGtmVariables,
  getDefaultWorkspacePath,
  GtmApiError,
} from "../../../lib/gtm/api.js";
import { getGtmAccessToken } from "../../../lib/gtm/access.js";
import { hasPlatformAccess } from "../../../lib/platform-access.js";
import { AppError } from "../../../types/index.js";
import { logToolCall } from "../../../lib/usage-logger.js";
import { logMcpError } from "../../../lib/error-logger.js";
import { config } from "../../../config/index.js";

interface UserContext {
  userId: string;
  propertyId: string;
  source: string;
}

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify({ success: true, data }, null, 2) },
    ],
  };
}

function fail(message: string): ToolResult {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify({ success: false, error: message }, null, 2) },
    ],
    isError: true,
  };
}

/**
 * Shared wrapper: entitlement re-check, timing, logging, error mapping.
 */
async function runGtmTool(
  toolName: string,
  user: UserContext,
  fn: (accessToken: string) => Promise<unknown>
): Promise<ToolResult> {
  const startTime = Date.now();
  try {
    const entitled = await hasPlatformAccess(user.userId, "gtm");
    if (!entitled) {
      throw new AppError(
        "PLATFORM_ACCESS_DENIED",
        "Tag Manager access is not enabled for your account. Contact your administrator.",
        403
      );
    }

    const accessToken = await getGtmAccessToken(user.userId);
    const data = await fn(accessToken);

    logToolCall({
      userId: user.userId,
      toolName,
      siteUrl: "gtm",
      source: user.source,
      status: "success",
      responseTimeMs: Date.now() - startTime,
      service: "gtm",
    }).catch(() => undefined);

    return ok(data);
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const msg =
      error instanceof GtmApiError
        ? error.userMessage(config.app.url)
        : error instanceof AppError
          ? error.message
          : "Tag Manager request failed";

    logToolCall({
      userId: user.userId,
      toolName,
      siteUrl: "gtm",
      source: user.source,
      status: "error",
      responseTimeMs,
      service: "gtm",
    }).catch(() => undefined);

    logMcpError({
      timestamp: new Date().toISOString(),
      tool: toolName,
      site_url: "gtm",
      user_id: user.userId,
      status: "error",
      error_message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      response_time_ms: responseTimeMs,
    }).catch(() => undefined);

    return fail(msg);
  }
}

const CONTAINER_PATH = z
  .string()
  .max(200)
  .regex(/^accounts\/\d+\/containers\/\d+$/, "Use the container path from gtm_list_containers")
  .describe('Container path from gtm_list_containers (e.g., "accounts/123/containers/456")');

export function registerGtmTools(server: McpServer, user: UserContext): void {
  server.tool(
    "gtm_list_accounts",
    "List all Google Tag Manager accounts you can access. Start here to find account paths.",
    {},
    async () =>
      runGtmTool("gtm_list_accounts", user, async (token) => {
        const accounts = await listGtmAccounts(token);
        return {
          total: accounts.length,
          accounts: accounts.map((a) => ({ path: a.path, name: a.name })),
        };
      })
  );

  server.tool(
    "gtm_list_containers",
    "List GTM containers in an account, with their public GTM-XXXXXX IDs.",
    {
      account_path: z
        .string()
        .max(100)
        .regex(/^accounts\/\d+$/, "Use the account path from gtm_list_accounts")
        .describe('Account path from gtm_list_accounts (e.g., "accounts/123")'),
    },
    async (params) =>
      runGtmTool("gtm_list_containers", user, async (token) => {
        const containers = await listGtmContainers(token, params.account_path);
        return {
          total: containers.length,
          containers: containers.map((c) => ({
            path: c.path,
            name: c.name,
            public_id: c.publicId,
            usage_context: c.usageContext,
          })),
        };
      })
  );

  server.tool(
    "gtm_list_tags",
    "List all tags in a GTM container's default workspace: type, paused state, firing/blocking triggers.",
    { container_path: CONTAINER_PATH },
    async (params) =>
      runGtmTool("gtm_list_tags", user, async (token) => {
        const ws = await getDefaultWorkspacePath(token, params.container_path);
        const tags = await listGtmTags(token, ws);
        return {
          total: tags.length,
          workspace: ws,
          tags: tags.map((t) => ({
            id: t.tagId,
            name: t.name,
            type: t.type,
            paused: t.paused ?? false,
            firing_trigger_ids: t.firingTriggerId ?? [],
            blocking_trigger_ids: t.blockingTriggerId ?? [],
          })),
        };
      })
  );

  server.tool(
    "gtm_list_triggers",
    "List all triggers in a GTM container's default workspace.",
    { container_path: CONTAINER_PATH },
    async (params) =>
      runGtmTool("gtm_list_triggers", user, async (token) => {
        const ws = await getDefaultWorkspacePath(token, params.container_path);
        const triggers = await listGtmTriggers(token, ws);
        return {
          total: triggers.length,
          triggers: triggers.map((t) => ({ id: t.triggerId, name: t.name, type: t.type })),
        };
      })
  );

  server.tool(
    "gtm_list_variables",
    "List all user-defined variables in a GTM container's default workspace.",
    { container_path: CONTAINER_PATH },
    async (params) =>
      runGtmTool("gtm_list_variables", user, async (token) => {
        const ws = await getDefaultWorkspacePath(token, params.container_path);
        const variables = await listGtmVariables(token, ws);
        return {
          total: variables.length,
          variables: variables.map((v) => ({ id: v.variableId, name: v.name, type: v.type })),
        };
      })
  );

  server.tool(
    "gtm_container_audit",
    "Audit a GTM container's configuration: paused tags, tags with no firing trigger, orphaned triggers, and a tag-type summary. Config-level audit only - it reads the GTM setup, not what fires on the live site.",
    { container_path: CONTAINER_PATH },
    async (params) =>
      runGtmTool("gtm_container_audit", user, async (token) => {
        const ws = await getDefaultWorkspacePath(token, params.container_path);
        const [tags, triggers, variables] = [
          await listGtmTags(token, ws),
          await listGtmTriggers(token, ws),
          await listGtmVariables(token, ws),
        ];

        const definedTriggerIds = new Set(triggers.map((t) => t.triggerId));
        const referencedTriggerIds = new Set(
          tags.flatMap((t) => [...(t.firingTriggerId ?? []), ...(t.blockingTriggerId ?? [])])
        );

        const pausedTags = tags.filter((t) => t.paused);
        const tagsWithoutTriggers = tags.filter(
          (t) => !t.paused && (t.firingTriggerId ?? []).length === 0
        );
        // Built-in triggers (e.g. All Pages = id "2147479553") are referenced
        // but never listed; only flag listed triggers nothing references.
        const orphanedTriggers = triggers.filter((t) => !referencedTriggerIds.has(t.triggerId));

        const typeCounts: Record<string, number> = {};
        for (const t of tags) typeCounts[t.type] = (typeCounts[t.type] ?? 0) + 1;

        return {
          workspace: ws,
          totals: { tags: tags.length, triggers: triggers.length, variables: variables.length },
          tag_types: typeCounts,
          findings: {
            paused_tags: pausedTags.map((t) => ({ id: t.tagId, name: t.name, type: t.type })),
            tags_without_firing_triggers: tagsWithoutTriggers.map((t) => ({
              id: t.tagId,
              name: t.name,
              type: t.type,
            })),
            orphaned_triggers: orphanedTriggers.map((t) => ({
              id: t.triggerId,
              name: t.name,
              type: t.type,
            })),
          },
          note:
            "This audits the container CONFIGURATION. To verify what actually fires on a live page, cross-check with GA4 events (ga_events) and, once available, the page scanner.",
        };
      })
  );
}
