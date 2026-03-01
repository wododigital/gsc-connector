/**
 * Usage Logger
 * Writes tool call events to the usage_logs table.
 * Non-critical - failures are silently swallowed so they never break tool calls.
 */

import db from "./db.js";

export interface UsageLogParams {
  userId: string;
  toolName: string;
  siteUrl: string;
  source: string;
  status: "success" | "error";
  responseTimeMs: number;
  service?: "gsc" | "ga4";
}

export async function logToolCall(params: UsageLogParams): Promise<void> {
  try {
    await db.usageLog.create({
      data: {
        userId: params.userId,
        toolName: params.toolName,
        siteUrl: params.siteUrl,
        source: params.source,
        status: params.status,
        responseTimeMs: params.responseTimeMs,
        service: params.service ?? "gsc",
      },
    });
  } catch (err) {
    console.error("[usage-logger] Write failed:", err);
  }
}
