/**
 * MCP Connector Alias Route (multi-account)
 *
 * Exposes the SAME MCP server at a per-client URL so Claude (and other MCP
 * clients) will treat each one as a distinct connector. Claude deduplicates
 * connectors by URL, which otherwise blocks connecting two Google accounts
 * through the single `/api/mcp` endpoint.
 *
 * The `[client]` segment is purely a label for Claude's connector identity -
 * the bridge identifies the user by their OAuth bearer token, not the path,
 * so every alias proxies to the same internal MCP server. Use any unique slug
 * per client account, e.g.:
 *
 *   https://bridge.theomg.ai/api/connect/dentique   -> login as x@gmail.com
 *   https://bridge.theomg.ai/api/connect/acme        -> login as y@gmail.com
 *
 * Handlers are re-exported verbatim from the canonical `/api/mcp` route so the
 * proxy/logging/OAuth behaviour stays identical and there is a single source
 * of truth.
 */

export { GET, POST, DELETE, OPTIONS, HEAD } from "../../mcp/route";
