/**
 * GBP tool context helper.
 *
 * Re-exports getGbpAccessToken from the shared lib helper so MCP tools and
 * Next.js server components both pull from the same implementation.
 */

export { getGbpAccessToken } from "../../../lib/gbp/access.js";
