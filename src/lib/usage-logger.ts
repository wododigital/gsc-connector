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
}

export async function logToolCall(params: UsageLogParams): Promise<void> {
  try {
    await db.usageLog.create({ data: params });
  } catch (err) {
    console.error("[usage-logger] Write failed:", err);
  }
}
