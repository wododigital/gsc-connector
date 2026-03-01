-- CreateTable
CREATE TABLE "mcp_debug_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tool" TEXT NOT NULL DEFAULT 'unknown',
    "site_url" TEXT NOT NULL DEFAULT 'unknown',
    "user_id" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "error_message" TEXT,
    "stack" TEXT,
    "response_time_ms" INTEGER,
    "request_body" TEXT,
    "response_body" TEXT,

    CONSTRAINT "mcp_debug_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mcp_debug_logs_timestamp_idx" ON "mcp_debug_logs"("timestamp");

-- CreateIndex
CREATE INDEX "mcp_debug_logs_user_id_timestamp_idx" ON "mcp_debug_logs"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "mcp_debug_logs_status_timestamp_idx" ON "mcp_debug_logs"("status", "timestamp");

-- CreateIndex
CREATE INDEX "mcp_debug_logs_tool_timestamp_idx" ON "mcp_debug_logs"("tool", "timestamp");
