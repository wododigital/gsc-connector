/**
 * GSC Connect - MCP Server
 * 
 * This is the core MCP server that exposes Google Search Console
 * data as tools for AI assistants (Claude, ChatGPT, Cursor).
 * 
 * Transport: Streamable HTTP + SSE (legacy)
 * Auth: OAuth2 Bearer tokens validated against the oauth_tokens table
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Initialize MCP Server
const server = new McpServer({
  name: "gsc-connect",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

// ============================================================
// TOOL 1: get_search_analytics
// The most powerful and flexible tool - full search analytics
// ============================================================
server.tool(
  "get_search_analytics",
  "Get search performance data (clicks, impressions, CTR, position) with flexible date ranges and filters",
  {
    days: z.number().min(1).max(540).default(28).describe("Number of days to look back from today"),
    dimensions: z
      .array(z.enum(["query", "page", "date", "country", "device"]))
      .default(["query"])
      .describe("Dimensions to group by"),
    filters: z
      .object({
        query: z.string().optional().describe("Filter by search query (contains)"),
        page: z.string().optional().describe("Filter by page URL (contains)"),
        country: z.string().optional().describe("Filter by country code (e.g., 'USA')"),
      })
      .optional()
      .describe("Optional filters"),
    row_limit: z.number().min(1).max(25000).default(100).describe("Number of rows to return"),
    start_date: z.string().optional().describe("Explicit start date (YYYY-MM-DD), overrides 'days'"),
    end_date: z.string().optional().describe("Explicit end date (YYYY-MM-DD)"),
  },
  async (params, extra) => {
    // TODO: Implementation
    // 1. Extract user from OAuth bearer token (via extra.authInfo or session)
    // 2. Get user's active GSC property from database
    // 3. Get fresh Google access token using stored refresh token
    // 4. Call Google Search Console API: searchAnalytics.query
    // 5. Format and return results

    const { days, dimensions, filters, row_limit, start_date, end_date } = params;

    // Calculate date range
    const endDate = end_date || new Date().toISOString().split("T")[0];
    const startDate =
      start_date ||
      new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Build GSC API request body
    const requestBody: any = {
      startDate,
      endDate,
      dimensions,
      rowLimit: row_limit,
    };

    // Add filters if provided
    if (filters) {
      requestBody.dimensionFilterGroups = [
        {
          filters: Object.entries(filters)
            .filter(([_, value]) => value !== undefined)
            .map(([dimension, expression]) => ({
              dimension,
              operator: "contains",
              expression,
            })),
        },
      ];
    }

    // TODO: Make actual API call
    // const data = await callGSCApi(userId, 'searchAnalytics.query', requestBody);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              status: "scaffold",
              message: "Replace with actual GSC API call",
              requestBody,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 2: get_top_keywords
// Simplified view of top performing keywords
// ============================================================
server.tool(
  "get_top_keywords",
  "List top keywords by performance (clicks, impressions, CTR, or position)",
  {
    days: z.number().min(1).max(90).default(28).describe("Number of days to analyze"),
    limit: z.number().min(1).max(100).default(10).describe("Number of keywords to return"),
    sort_by: z
      .enum(["clicks", "impressions", "ctr", "position"])
      .default("clicks")
      .describe("Sort metric"),
  },
  async (params) => {
    // TODO: Implementation
    // Calls searchAnalytics.query with dimension: ["query"]
    // Sorts by the specified metric
    // Returns top N keywords with all metrics

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            params,
            api_call: "searchAnalytics.query with dimension=['query']",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 3: get_top_pages
// Top performing pages
// ============================================================
server.tool(
  "get_top_pages",
  "List top performing pages by clicks, impressions, CTR, or position",
  {
    days: z.number().min(1).max(90).default(28).describe("Number of days to analyze"),
    limit: z.number().min(1).max(100).default(10).describe("Number of pages to return"),
    sort_by: z
      .enum(["clicks", "impressions", "ctr", "position"])
      .default("clicks")
      .describe("Sort metric"),
  },
  async (params) => {
    // TODO: Implementation
    // Calls searchAnalytics.query with dimension: ["page"]

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            params,
            api_call: "searchAnalytics.query with dimension=['page']",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 4: get_keyword_for_page
// Keywords driving traffic to a specific page
// ============================================================
server.tool(
  "get_keyword_for_page",
  "See which keywords drive traffic to a specific page",
  {
    page_url: z.string().describe("The page URL to analyze (can be partial match)"),
    days: z.number().min(1).max(90).default(28).describe("Number of days to analyze"),
    limit: z.number().min(1).max(100).default(20).describe("Number of keywords to return"),
  },
  async (params) => {
    // TODO: Implementation
    // Calls searchAnalytics.query with:
    //   dimension: ["query"]
    //   dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: page_url }] }]

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            params,
            api_call: "searchAnalytics.query filtered by page",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 5: inspect_url
// Check indexing status of a URL
// ============================================================
server.tool(
  "inspect_url",
  "Check the indexing status of a URL in Google Search Console",
  {
    url: z.string().describe("The full URL to inspect (must be on your verified property)"),
  },
  async (params) => {
    // TODO: Implementation
    // Calls URL Inspection API: urlInspection.index.inspect
    // Request body: { inspectionUrl: url, siteUrl: activeProperty }
    // Returns: indexing status, crawl info, rich results, mobile usability

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            params,
            api_call: "urlInspection.index.inspect",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 6: list_sitemaps
// List all submitted sitemaps
// ============================================================
server.tool(
  "list_sitemaps",
  "List all sitemaps submitted for your site",
  {},
  async () => {
    // TODO: Implementation
    // Calls sitemaps.list with siteUrl parameter
    // Returns array of sitemaps with their status, last download date, etc.

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            api_call: "sitemaps.list",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 7: get_sitemap
// Get details about a specific sitemap
// ============================================================
server.tool(
  "get_sitemap",
  "Get details about a specific sitemap",
  {
    sitemap_url: z
      .string()
      .describe("The full URL of the sitemap (e.g., https://example.com/sitemap.xml)"),
  },
  async (params) => {
    // TODO: Implementation
    // Calls sitemaps.get with siteUrl and feedpath parameters

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            params,
            api_call: "sitemaps.get",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 8: submit_sitemap
// Submit a new sitemap
// ============================================================
server.tool(
  "submit_sitemap",
  "Submit a new sitemap to Google Search Console",
  {
    sitemap_url: z
      .string()
      .describe("The full URL of the sitemap to submit (e.g., https://example.com/sitemap.xml)"),
  },
  async (params) => {
    // TODO: Implementation
    // Calls sitemaps.submit with siteUrl and feedpath parameters
    // NOTE: This is a WRITE operation - consider requiring explicit user approval

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            params,
            api_call: "sitemaps.submit",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 9: delete_sitemap
// Remove a sitemap
// ============================================================
server.tool(
  "delete_sitemap",
  "Remove a sitemap from Google Search Console",
  {
    sitemap_url: z.string().describe("The full URL of the sitemap to delete"),
  },
  async (params) => {
    // TODO: Implementation
    // Calls sitemaps.delete with siteUrl and feedpath parameters
    // NOTE: This is a DESTRUCTIVE operation - consider requiring explicit user approval

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            params,
            api_call: "sitemaps.delete",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 10: list_sites
// List all GSC properties
// ============================================================
server.tool(
  "list_sites",
  "List all sites you have access to in Google Search Console",
  {},
  async () => {
    // TODO: Implementation
    // Calls sites.list
    // Returns array of site entries with siteUrl and permissionLevel

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            api_call: "sites.list",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 11: add_site
// Add a new site to GSC
// ============================================================
server.tool(
  "add_site",
  "Add a new site to Google Search Console (requires verification)",
  {
    site_url: z
      .string()
      .describe(
        "The URL of the site to add (e.g., https://example.com/ or sc-domain:example.com)"
      ),
  },
  async (params) => {
    // TODO: Implementation
    // Calls sites.add with siteUrl parameter
    // NOTE: WRITE operation, requires webmasters scope (not readonly)

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            params,
            api_call: "sites.add",
            note: "Requires webmasters scope (write access)",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 12: delete_site
// Remove a site from GSC
// ============================================================
server.tool(
  "delete_site",
  "Remove a site from Google Search Console",
  {
    site_url: z.string().describe("The URL of the site to remove"),
  },
  async (params) => {
    // TODO: Implementation
    // Calls sites.delete with siteUrl parameter
    // NOTE: DESTRUCTIVE operation

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            params,
            api_call: "sites.delete",
            note: "Destructive operation - requires confirmation",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TOOL 13: run_mobile_friendly_test
// Test URL for mobile-friendliness
// ============================================================
server.tool(
  "run_mobile_friendly_test",
  "Test if a URL is mobile-friendly according to Google",
  {
    url: z.string().describe("The full URL to test for mobile-friendliness"),
  },
  async (params) => {
    // TODO: Implementation
    // Calls URL Testing Tools API: urlTestingTools.mobileFriendlyTest.run
    // Request body: { url: params.url }
    // Returns: mobileFriendliness status, issues found, resource issues

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "scaffold",
            params,
            api_call: "urlTestingTools.mobileFriendlyTest.run",
          }),
        },
      ],
    };
  }
);

// ============================================================
// TRANSPORT SETUP
// ============================================================

/**
 * TODO: Set up transport layer
 * 
 * For Streamable HTTP (recommended for Claude.ai):
 * 
 *   import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
 *   import express from "express";
 * 
 *   const app = express();
 *   app.use(authMiddleware); // Validate OAuth bearer token
 * 
 *   app.head("/mcp", (req, res) => {
 *     res.setHeader("MCP-Protocol-Version", "2025-06-18");
 *     res.status(200).end();
 *   });
 * 
 *   app.post("/mcp", async (req, res) => {
 *     const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
 *     await server.connect(transport);
 *     await transport.handleRequest(req, res);
 *   });
 * 
 * For SSE (legacy, for Claude Desktop compatibility):
 * 
 *   import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
 * 
 *   app.get("/mcp/sse", async (req, res) => {
 *     const transport = new SSEServerTransport("/mcp/sse", res);
 *     await server.connect(transport);
 *   });
 */

export default server;
