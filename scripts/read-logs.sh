#!/usr/bin/env bash
# Read and filter MCP logs.
#
# Usage:
#   ./scripts/read-logs.sh                  # Last 50 lines of all requests
#   ./scripts/read-logs.sh --errors-only    # Errors only
#   ./scripts/read-logs.sh --tool get_top_keywords
#   ./scripts/read-logs.sh --last 100       # Last 100 entries
#   ./scripts/read-logs.sh --errors-only --tool inspect_url

LOGS_DIR="$(cd "$(dirname "$0")/.." && pwd)/logs"
TOOL_FILTER=""
ERRORS_ONLY=false
LAST_N=50

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)      TOOL_FILTER="$2"; shift 2 ;;
    --errors-only) ERRORS_ONLY=true; shift ;;
    --last)      LAST_N="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; shift ;;
  esac
done

if $ERRORS_ONLY; then
  LOG_FILE="${LOGS_DIR}/mcp-errors.log"
else
  LOG_FILE="${LOGS_DIR}/mcp-requests.log"
fi

if [ ! -f "$LOG_FILE" ]; then
  echo "No log file at $LOG_FILE - no requests logged yet."
  exit 0
fi

# Filter by tool name if specified, then take last N lines
if [ -n "$TOOL_FILTER" ]; then
  LINES=$(grep "\"tool\":\"${TOOL_FILTER}\"" "$LOG_FILE" | tail -n "$LAST_N")
else
  LINES=$(tail -n "$LAST_N" "$LOG_FILE")
fi

if [ -z "$LINES" ]; then
  echo "No matching log entries."
  exit 0
fi

echo "$LINES" | while IFS= read -r line; do
  # Pretty-print each JSON line using node (available in Node.js 22 env)
  node -e "
try {
  const d = JSON.parse(process.argv[1]);
  const status = (d.status || '').toUpperCase().padEnd(7);
  const tool = (d.tool || '').padEnd(30);
  const ms = String(d.response_time_ms || '').padEnd(6);
  const site = d.site_url || '';
  const err = d.error_message ? ' | ' + d.error_message : '';
  console.log('[' + (d.timestamp || '') + '] ' + status + ' ' + tool + ' ' + ms + 'ms site=' + site + err);
} catch(e) {
  console.log(process.argv[1]);
}
" "$line" 2>/dev/null || echo "$line"
done
