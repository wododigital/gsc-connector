/**
 * Google Ads MCP tools (initial read-only set).
 *
 * GATED: registered only for users with the "google_ads" entitlement and
 * re-checked per call. All tools also require GOOGLE_ADS_DEVELOPER_TOKEN -
 * until Google approves the token application they return a clear
 * "pending approval" message.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listAccessibleCustomers,
  adsSearch,
  AdsApiError,
} from "../../../lib/ads/api.js";
import { getAdsAccessToken } from "../../../lib/ads/access.js";
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

async function runAdsTool(
  toolName: string,
  user: UserContext,
  fn: (accessToken: string) => Promise<unknown>
): Promise<ToolResult> {
  const startTime = Date.now();
  try {
    const entitled = await hasPlatformAccess(user.userId, "google_ads");
    if (!entitled) {
      throw new AppError(
        "PLATFORM_ACCESS_DENIED",
        "Google Ads access is not enabled for your account. Contact your administrator.",
        403
      );
    }

    const accessToken = await getAdsAccessToken(user.userId);
    const data = await fn(accessToken);

    logToolCall({
      userId: user.userId,
      toolName,
      siteUrl: "ads",
      source: user.source,
      status: "success",
      responseTimeMs: Date.now() - startTime,
      service: "ads",
    }).catch(() => undefined);

    return ok(data);
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const msg =
      error instanceof AdsApiError
        ? error.userMessage(config.app.url)
        : error instanceof AppError
          ? error.message
          : "Google Ads request failed";

    logToolCall({
      userId: user.userId,
      toolName,
      siteUrl: "ads",
      source: user.source,
      status: "error",
      responseTimeMs,
      service: "ads",
    }).catch(() => undefined);

    logMcpError({
      timestamp: new Date().toISOString(),
      tool: toolName,
      site_url: "ads",
      user_id: user.userId,
      status: "error",
      error_message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      response_time_ms: responseTimeMs,
    }).catch(() => undefined);

    return fail(msg);
  }
}

const CUSTOMER_ID = z
  .string()
  .max(20)
  .regex(/^[\d-]+$/, "Customer ID is digits (dashes allowed), e.g. 123-456-7890")
  .describe('Google Ads customer ID (e.g. "123-456-7890"), from ads_list_accounts');

const LOGIN_CUSTOMER_ID = z
  .string()
  .max(20)
  .regex(/^[\d-]+$/)
  .optional()
  .describe("Manager (MCC) account ID, required when accessing a client account through a manager");

export function registerAdsTools(server: McpServer, user: UserContext): void {
  server.tool(
    "ads_list_accounts",
    "List Google Ads accounts accessible to your connected Google user. Start here to find customer IDs.",
    {},
    async () =>
      runAdsTool("ads_list_accounts", user, async (token) => {
        const resourceNames = await listAccessibleCustomers(token);
        return {
          total: resourceNames.length,
          customer_ids: resourceNames.map((r) => r.replace("customers/", "")),
        };
      })
  );

  server.tool(
    "ads_list_conversion_actions",
    "List conversion actions in a Google Ads account with their status and category - the starting point for auditing conversion tracking health.",
    { customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID },
    async (params) =>
      runAdsTool("ads_list_conversion_actions", user, async (token) => {
        const rows = await adsSearch(
          token,
          params.customer_id,
          `SELECT conversion_action.id, conversion_action.name, conversion_action.status,
                  conversion_action.type, conversion_action.category,
                  conversion_action.primary_for_goal, conversion_action.counting_type
           FROM conversion_action
           ORDER BY conversion_action.status`,
          params.login_customer_id
        );
        return { total: rows.length, conversion_actions: rows };
      })
  );

  server.tool(
    "ads_run_gaql",
    "Run a read-only GAQL (Google Ads Query Language) query for advanced reporting - campaigns, ad groups, metrics, conversions.",
    {
      customer_id: CUSTOMER_ID,
      login_customer_id: LOGIN_CUSTOMER_ID,
      query: z
        .string()
        .max(4000)
        .describe("GAQL SELECT query. Only SELECT queries are allowed."),
    },
    async (params) =>
      runAdsTool("ads_run_gaql", user, async (token) => {
        const trimmed = params.query.trim();
        if (!/^select\s/i.test(trimmed)) {
          throw new AppError("VALIDATION_ERROR", "Only SELECT GAQL queries are allowed.", 400);
        }
        const rows = await adsSearch(
          token,
          params.customer_id,
          trimmed,
          params.login_customer_id
        );
        return { total: rows.length, results: rows };
      })
  );
}
