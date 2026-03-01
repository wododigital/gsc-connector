/**
 * MCP Error Logger
 *
 * Writes structured JSON log entries to:
 *   logs/mcp-requests.log  - every request (success + error)
 *   logs/mcp-errors.log    - error-only subset
 *   DB: mcp_debug_logs     - queryable in production
 *
 * Works in both Next.js (Node runtime) and the Express MCP server.
 * File writes fail gracefully so logging never breaks tool calls.
 */

import fs from "fs";
import path from "path";
import db from "./db.js";

const LOG_DIR = path.join(process.cwd(), "logs");
const MAX_LINES = 10_000;

export interface McpLogEntry {
  timestamp: string;
  tool: string;
  site_url: string;
  user_id: string;
  status: "success" | "error" | "timeout";
  error_message?: string;
  stack?: string;
  response_time_ms: number;
  request_body?: unknown;
  response_body?: unknown;
}

function ensureLogDir(): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch {
    // Silently fail - file system may be read-only in some environments
  }
}

function appendToFile(filename: string, entry: McpLogEntry): void {
  try {
    const logPath = path.join(LOG_DIR, filename);
    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(logPath, line, "utf8");

    // Rotate: keep last MAX_LINES entries
    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.split("\n").filter(Boolean);
    if (lines.length > MAX_LINES) {
      const trimmed = lines.slice(-MAX_LINES).join("\n") + "\n";
      fs.writeFileSync(logPath, trimmed, "utf8");
    }
  } catch {
    // Silently fail
  }
}

async function writeToDb(entry: McpLogEntry): Promise<void> {
  try {
    await db.mcpDebugLog.create({
      data: {
        timestamp: new Date(entry.timestamp),
        tool: entry.tool,
        siteUrl: entry.site_url,
        userId: entry.user_id,
        status: entry.status,
        errorMessage: entry.error_message ?? null,
        stack: entry.stack ?? null,
        responseTimeMs: entry.response_time_ms,
        requestBody: entry.request_body
          ? JSON.stringify(entry.request_body)
          : null,
        responseBody: entry.response_body
          ? JSON.stringify(entry.response_body)
          : null,
      },
    });
  } catch {
    // Non-critical - never let logging break a request
  }
}

/**
 * Log any MCP request (both success and error).
 * Fire-and-forget safe - call with .catch(() => undefined).
 */
export async function logMcpRequest(entry: McpLogEntry): Promise<void> {
  ensureLogDir();
  appendToFile("mcp-requests.log", entry);
  await writeToDb(entry);
}

/**
 * Log an MCP error. Writes to both mcp-errors.log and mcp-requests.log.
 * Also logs to console.error for immediate visibility.
 * Fire-and-forget safe - call with .catch(() => undefined).
 */
export async function logMcpError(entry: McpLogEntry): Promise<void> {
  console.error(
    `[MCP ERROR] ${entry.timestamp} tool=${entry.tool} site=${entry.site_url} user=${entry.user_id} ${entry.response_time_ms}ms | ${entry.error_message}`,
    entry.stack ? `\n${entry.stack}` : ""
  );
  ensureLogDir();
  appendToFile("mcp-errors.log", entry);
  appendToFile("mcp-requests.log", entry);
  await writeToDb(entry);
}
