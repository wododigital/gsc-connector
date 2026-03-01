#!/usr/bin/env bash
# GSC Connect health check - runs PASS/FAIL checks on all services.
#
# Usage:
#   ./scripts/health-check.sh
#   APP_URL=https://your-app.railway.app ./scripts/health-check.sh

APP_URL="${APP_URL:-http://localhost:3000}"
MCP_PORT="${MCP_PORT:-3001}"

PASS=0
FAIL=0

check() {
  local name="$1"
  local result="$2"
  local detail="${3:-}"
  if [ "$result" = "pass" ]; then
    printf "  [PASS] %s\n" "$name"
    PASS=$((PASS + 1))
  else
    printf "  [FAIL] %s%s\n" "$name" "${detail:+ ($detail)}"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== GSC Connect Health Check ==="
echo "    Target: $APP_URL"
echo ""

# --- Next.js + full health endpoint ---
HEALTH_RAW=$(curl -s --max-time 10 "${APP_URL}/api/health" 2>/dev/null)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${APP_URL}/api/health" 2>/dev/null)

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "503" ]; then
  check "Next.js responding" "pass"
else
  check "Next.js responding" "fail" "HTTP $HTTP_STATUS"
fi

if echo "$HEALTH_RAW" | grep -q '"nextjs":true'; then
  check "Next.js health" "pass"
else
  check "Next.js health" "fail"
fi

if echo "$HEALTH_RAW" | grep -q '"database":true'; then
  check "Database connection" "pass"
else
  check "Database connection" "fail"
fi

if echo "$HEALTH_RAW" | grep -q '"mcp_server":true'; then
  check "MCP server (via health)" "pass"
else
  check "MCP server (via health)" "fail"
fi

# --- MCP server direct ---
MCP_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:${MCP_PORT}/health" 2>/dev/null)
if [ "$MCP_HTTP" = "200" ]; then
  check "MCP server direct (port $MCP_PORT)" "pass"
else
  check "MCP server direct (port $MCP_PORT)" "fail" "HTTP $MCP_HTTP"
fi

# --- OAuth metadata (root level) ---
OAUTH_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${APP_URL}/.well-known/oauth-authorization-server" 2>/dev/null)
if [ "$OAUTH_HTTP" = "200" ]; then
  check "OAuth metadata /.well-known/oauth-authorization-server" "pass"
else
  check "OAuth metadata /.well-known/oauth-authorization-server" "fail" "HTTP $OAUTH_HTTP"
fi

# --- MCP proxy endpoint ---
MCP_PROXY_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 -X HEAD "${APP_URL}/api/mcp" 2>/dev/null)
if [ "$MCP_PROXY_HTTP" = "200" ]; then
  check "MCP proxy /api/mcp" "pass"
else
  check "MCP proxy /api/mcp" "fail" "HTTP $MCP_PROXY_HTTP"
fi

# --- Dynamic Client Registration ---
DCR_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  -X POST "${APP_URL}/api/oauth/register" \
  -H "Content-Type: application/json" \
  -d '{"client_name":"health-check","redirect_uris":["https://example.com/cb"]}' 2>/dev/null)
if [ "$DCR_HTTP" = "201" ] || [ "$DCR_HTTP" = "200" ]; then
  check "OAuth Dynamic Client Registration" "pass"
else
  check "OAuth Dynamic Client Registration" "fail" "HTTP $DCR_HTTP"
fi

echo ""
echo "Results: ${PASS} passed, ${FAIL} failed"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
