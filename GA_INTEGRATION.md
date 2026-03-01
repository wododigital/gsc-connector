# GA4 Integration for OMG AI MCP - Complete Build Instructions

## TABLE OF CONTENTS
1. Overview & Critical Rules
2. Architecture & Existing Codebase
3. Rebranding (WODO GSC Con Test -> OMG AI)
4. Google Cloud APIs & OAuth Changes
5. Database Schema Changes
6. GA4 API Reference (Complete)
7. MCP Tools to Build (10 tools)
8. Consent Screen Changes
9. Fuzzy Property Matching for GA4
10. Error Handling Patterns
11. Testing Checklist
12. Deployment Steps

---

## 1. OVERVIEW & CRITICAL RULES

Add Google Analytics 4 (GA4) reporting support to the existing GSC MCP connector. This uses the same Google OAuth flow, same user accounts, same architecture. GA4 tools are added alongside existing GSC tools.

### CRITICAL RULES - READ BEFORE WRITING ANY CODE

1. **DO NOT MODIFY ANY EXISTING GSC TOOL FILES.** All 13+ GSC tools must continue working exactly as they do now. If you need to import a shared utility, import it - don't restructure it.

2. **GA4 tools are ADDITIVE ONLY.** Create new files for GA4 tools. Do not refactor existing GSC files to "share code" unless absolutely necessary.

3. **Same OAuth token** for both GSC and GA4. Add the GA4 scope to the existing OAuth flow. Both services use the same `google_credentials` table.

4. **Follow the EXACT same patterns** from the GSC codebase: error logging format, property resolution, auth middleware, response formatting.

5. **Test ALL GSC tools AFTER adding GA4** to ensure nothing is broken. The GSC connector is in production and serving real users.

6. **GA4 property IDs are numeric strings** like "properties/123456789". They are NOT URLs like GSC properties (which are like "https://example.com/").

7. **Never use em dashes in any content or copy.** Use regular hyphens instead.

---

## 2. ARCHITECTURE & EXISTING CODEBASE

### Current Stack
- **Runtime:** Node.js 22 (LTS)
- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL (Railway)
- **Deployment:** Railway (single service, port 3000)
- **MCP Server:** Runs on internal port 3001, proxied through Next.js at /api/mcp

### Key File Locations (explore the repo to confirm exact paths)
```
src/
  app/
    api/
      mcp/route.ts            -- MCP proxy endpoint
      auth/google/route.ts     -- OAuth initiation
      gsc/callback/route.ts    -- OAuth callback
      health/route.ts          -- Health check
    oauth/consent/page.tsx     -- User consent screen
    dashboard/                 -- Dashboard pages
    page.tsx                   -- Landing page
    layout.tsx                 -- Root layout
  lib/
    mcp/
      tools/                   -- GSC tool implementations (DO NOT MODIFY)
      server.ts                -- MCP server setup
    db.ts                      -- Database connection
    auth.ts                    -- Auth utilities
  types/                       -- TypeScript types
scripts/
  read-logs.sh
  health-check.sh
public/
CLAUDE.md                      -- Agent debugging instructions
```

### Existing Database Tables
```
users                          -- User accounts
google_credentials             -- OAuth tokens (access_token, refresh_token, scope)
gsc_properties                 -- Google Search Console properties (site_url, is_active)
mcp_debug_logs                 -- Debug/error logs
usage_logs                     -- Tool usage tracking
oauth_clients                  -- Registered OAuth clients
oauth_codes                    -- Authorization codes
oauth_tokens                   -- MCP tokens
```

### Key Patterns Already Established

**Fuzzy Property Matching (resolveSiteUrl):**
The GSC tools use a `resolveSiteUrl()` helper that matches user input like "nandhini" to the full property URL "https://nandhini.com/". Build an equivalent `resolveGA4Property()` for GA4.

**Auth Middleware:**
Each tool calls auth middleware to get the user's credentials and check the token is valid. Follow the same pattern for GA4 tools.

**Error Logging:**
Tools log to both file (logs/mcp-requests.log, logs/mcp-errors.log) and database (mcp_debug_logs). GA4 tools should log to the same places.

**Usage Logging:**
Every tool call is logged to usage_logs with: tool_name, site_url, user_id, source, status, response_time_ms.

---

## 3. REBRANDING: WODO GSC Con Test -> OMG AI

### Files to Update
- `package.json`: name -> "omg-ai-mcp", description updated
- `src/app/layout.tsx`: title -> "OMG AI", meta tags updated
- `src/app/page.tsx`: landing page text/branding
- `src/app/dashboard/*`: all dashboard pages - titles, headers
- `src/app/oauth/consent/page.tsx`: branding on consent screen
- `src/app/api/.well-known/oauth-authorization-server/route.ts`: service name
- `README.md`: project name and description
- Any hardcoded "WODO" or "GSC Connect" or "GSC Con Test" strings (grep for them)

### Logo Files
- Main logo: Copy from `public/` or use uploaded SVG -> `public/logo.svg`
- Icon/favicon: Copy from `public/` or use uploaded SVG -> `public/icon.svg`
- Generate `public/favicon.ico` from the icon SVG (use sharp or similar)
- The icon must be served at a public URL for Claude.ai/ChatGPT connector thumbnails

### Connector Display
- Service name in OAuth metadata: **"OMG AI"**
- Description: **"Connect Google Search Console and Google Analytics to Claude, ChatGPT, and Cursor via MCP"**

---

## 4. GOOGLE CLOUD APIs & OAUTH CHANGES

### APIs to Enable (user will do this)
1. **Google Search Console API** - already enabled
2. **Google Analytics Data API** - for reporting (analyticsdata.googleapis.com)
3. **Google Analytics Admin API** - for listing properties (analyticsadmin.googleapis.com)

Same OAuth client ID and secret. No new credentials needed.

### OAuth Scope Changes

**Current scope:**
```
https://www.googleapis.com/auth/webmasters.readonly
```

**New combined scope (space-separated in the OAuth URL):**
```
https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly
```

### Where to Update
Find the file that builds the Google OAuth redirect URL (likely `src/app/api/auth/google/route.ts` or similar). Add the analytics.readonly scope to the scope parameter.

### IMPORTANT: Backward Compatibility
- Adding `analytics.readonly` means Google shows an updated consent screen
- Existing users must re-authorize to grant GA4 access
- **Handle gracefully:** If a user's stored token lacks the analytics scope, GA4 tools should return:
  `"Please reconnect your Google account to enable Analytics access. Go to [APP_URL]/dashboard and click 'Reconnect'."`
  Do NOT crash or throw an unhandled error.
- **How to detect:** When a GA4 API call returns 403 with "Request had insufficient authentication scopes", return the friendly message above.

---

## 5. DATABASE SCHEMA CHANGES

### New Migration: Add GA4 Properties Table

```sql
-- Migration: add_ga4_support.sql

-- GA4 properties table
CREATE TABLE IF NOT EXISTS ga4_properties (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL REFERENCES google_credentials(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  account_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, property_id)
);

-- Add service column to debug logs (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mcp_debug_logs' AND column_name = 'service'
  ) THEN
    ALTER TABLE mcp_debug_logs ADD COLUMN service TEXT DEFAULT 'gsc';
  END IF;
END $$;

-- Add service column to usage_logs (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usage_logs' AND column_name = 'service'
  ) THEN
    ALTER TABLE usage_logs ADD COLUMN service TEXT DEFAULT 'gsc';
  END IF;
END $$;
```

### ID Generation for ga4_properties
Use the same pattern as gsc_properties for generating IDs (UUID or nanoid).

---

## 6. GA4 API REFERENCE (Complete)

### Authentication
All GA4 API calls use the same OAuth2 Bearer token as GSC:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Admin API - List Properties

**Endpoint:** `GET https://analyticsadmin.googleapis.com/v1beta/accountSummaries`

**Query Params:**
- `pageSize` (optional, max 200)
- `pageToken` (optional, for pagination)

**Response:**
```json
{
  "accountSummaries": [
    {
      "name": "accountSummaries/123456",
      "account": "accounts/123456",
      "displayName": "My Company",
      "propertySummaries": [
        {
          "property": "properties/987654321",
          "displayName": "nandhini.com",
          "propertyType": "PROPERTY_TYPE_ORDINARY",
          "parent": "accounts/123456"
        }
      ]
    }
  ],
  "nextPageToken": "..."
}
```

**IMPORTANT:** Paginate! Some users have many accounts. Loop until no `nextPageToken`.

### Data API - Run Report (Main Workhorse)

**Endpoint:** `POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport`

Where `{propertyId}` is the numeric ID only (e.g., `987654321`), NOT "properties/987654321".

**Request Body:**
```json
{
  "dateRanges": [
    {
      "startDate": "2025-02-01",
      "endDate": "2025-02-28"
    }
  ],
  "dimensions": [
    { "name": "date" },
    { "name": "pagePath" }
  ],
  "metrics": [
    { "name": "sessions" },
    { "name": "activeUsers" },
    { "name": "screenPageViews" },
    { "name": "bounceRate" },
    { "name": "averageSessionDuration" }
  ],
  "dimensionFilter": {
    "filter": {
      "fieldName": "country",
      "stringFilter": {
        "matchType": "EXACT",
        "value": "United States"
      }
    }
  },
  "metricFilter": {
    "filter": {
      "fieldName": "sessions",
      "numericFilter": {
        "operation": "GREATER_THAN",
        "value": { "int64Value": "10" }
      }
    }
  },
  "orderBys": [
    {
      "metric": { "metricName": "sessions" },
      "desc": true
    }
  ],
  "limit": "100",
  "offset": "0",
  "keepEmptyRows": false,
  "returnPropertyQuota": true
}
```

**Date Range Shortcuts:** The API accepts these relative date strings:
- `"today"`, `"yesterday"`, `"NdaysAgo"` (e.g., `"28daysAgo"`, `"7daysAgo"`, `"90daysAgo"`)

**Response:**
```json
{
  "dimensionHeaders": [
    { "name": "date" },
    { "name": "pagePath" }
  ],
  "metricHeaders": [
    { "name": "sessions", "type": "TYPE_INTEGER" },
    { "name": "activeUsers", "type": "TYPE_INTEGER" },
    { "name": "screenPageViews", "type": "TYPE_INTEGER" },
    { "name": "bounceRate", "type": "TYPE_FLOAT" },
    { "name": "averageSessionDuration", "type": "TYPE_SECONDS" }
  ],
  "rows": [
    {
      "dimensionValues": [
        { "value": "20250201" },
        { "value": "/blog/article-1" }
      ],
      "metricValues": [
        { "value": "150" },
        { "value": "120" },
        { "value": "200" },
        { "value": "0.45" },
        { "value": "125.5" }
      ]
    }
  ],
  "rowCount": 1,
  "metadata": {},
  "propertyQuota": {
    "tokensPerDay": { "consumed": 5, "remaining": 199995 },
    "tokensPerHour": { "consumed": 5, "remaining": 39995 },
    "concurrentRequests": { "consumed": 0, "remaining": 10 }
  }
}
```

### Filter Expression Format (Complex Filters)

For AND/OR/NOT combinations:
```json
{
  "dimensionFilter": {
    "andGroup": {
      "expressions": [
        {
          "filter": {
            "fieldName": "country",
            "stringFilter": {
              "matchType": "EXACT",
              "value": "United States"
            }
          }
        },
        {
          "filter": {
            "fieldName": "pagePath",
            "stringFilter": {
              "matchType": "CONTAINS",
              "value": "/blog/"
            }
          }
        }
      ]
    }
  }
}
```

**String Filter Match Types:** `EXACT`, `BEGINS_WITH`, `ENDS_WITH`, `CONTAINS`, `FULL_REGEXP`, `PARTIAL_REGEXP`

**Numeric Filter Operations:** `EQUAL`, `LESS_THAN`, `LESS_THAN_OR_EQUAL`, `GREATER_THAN`, `GREATER_THAN_OR_EQUAL`

**In List Filter:**
```json
{
  "filter": {
    "fieldName": "country",
    "inListFilter": {
      "values": ["United States", "Canada", "United Kingdom"],
      "caseSensitive": false
    }
  }
}
```

### Data API - Run Realtime Report

**Endpoint:** `POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runRealtimeReport`

**Request Body:**
```json
{
  "dimensions": [
    { "name": "country" },
    { "name": "unifiedScreenName" }
  ],
  "metrics": [
    { "name": "activeUsers" },
    { "name": "screenPageViews" }
  ],
  "limit": "50",
  "minuteRanges": [
    { "name": "last_5_min", "startMinutesAgo": 4 },
    { "name": "last_30_min", "startMinutesAgo": 29, "endMinutesAgo": 0 }
  ]
}
```

**Realtime Dimensions (ONLY these are supported):**
- `appVersion`, `audienceId`, `audienceName`, `audienceResourceName`
- `city`, `cityId`, `country`, `countryId`
- `deviceCategory`, `eventName`, `minutesAgo`
- `platform`, `streamId`, `streamName`, `unifiedScreenName`

**Realtime Metrics (ONLY these are supported):**
- `activeUsers`, `eventCount`, `keyEvents`, `screenPageViews`

**NOTE:** Event-scoped custom dimensions/metrics are NOT supported in realtime.

### Data API - Get Metadata

**Endpoint:** `GET https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}/metadata`

Returns all available dimensions and metrics for a property, including custom ones.

### Rate Limits & Quotas (Token Bucket System)

**Standard (Free) GA4 Properties:**
| Quota | Limit |
|-------|-------|
| Tokens Per Property Per Day | 200,000 |
| Tokens Per Property Per Hour | 40,000 |
| Tokens Per Project Per Property Per Hour | 14,000 |
| Concurrent Requests Per Property | 10 |
| Server Errors Per Project Per Property Per Hour | 10 |

**Realtime quotas are separate from Core quotas.**

**Token consumption factors:**
- Number of dimensions and metrics requested
- Date range length
- Filter complexity
- High-cardinality dimensions
- Most simple requests consume 1-10 tokens

**Best practices:**
- Always include `"returnPropertyQuota": true` in requests
- Implement exponential backoff on 429 errors
- Cache responses where possible
- Keep dimension count reasonable (2-4 per request)

---

## 7. MCP TOOLS TO BUILD (10 tools)

### TOOL 1: ga_list_properties

**Purpose:** List all GA4 properties the user can access
**API:** Admin API - GET accountSummaries

```typescript
{
  name: "ga_list_properties",
  description: "List all your Google Analytics 4 properties",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

**Implementation:**
1. Get user credentials via auth middleware
2. Call `GET https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200`
3. Paginate if `nextPageToken` exists
4. Return only `is_active` properties from `ga4_properties` table
5. If no GA4 properties saved yet (first use), fetch from Admin API and save to `ga4_properties`
6. Format: list of `{ property_id, display_name, account_name }`

**Error handling:** If 403 scope error, return the "reconnect" message.

---

### TOOL 2: ga_run_report

**Purpose:** Flexible report query - the main workhorse
**API:** Data API - runReport

```typescript
{
  name: "ga_run_report",
  description: "Run a custom Google Analytics 4 report with flexible dimensions and metrics",
  inputSchema: {
    type: "object",
    properties: {
      property_id: {
        type: "string",
        description: "GA4 property to query. Use ga_list_properties to see available options."
      },
      dimensions: {
        type: "array",
        items: { type: "string" },
        description: "Dimensions to group by (e.g., 'date', 'pagePath', 'country', 'sessionSource')"
      },
      metrics: {
        type: "array",
        items: { type: "string" },
        description: "Metrics to retrieve (e.g., 'sessions', 'activeUsers', 'bounceRate', 'keyEvents')"
      },
      start_date: {
        type: "string",
        description: "Start date (YYYY-MM-DD or relative like '28daysAgo'). Default: 28daysAgo"
      },
      end_date: {
        type: "string",
        description: "End date (YYYY-MM-DD or 'today'). Default: today"
      },
      dimension_filter: {
        type: "object",
        description: "Optional filter. Example: {fieldName: 'country', matchType: 'EXACT', value: 'India'}"
      },
      limit: {
        type: "number",
        description: "Max rows (default 100, max 10000)"
      },
      order_by: {
        type: "string",
        description: "Metric or dimension to sort by (prefix with '-' for descending)"
      }
    },
    required: ["property_id"]
  }
}
```

**Implementation:**
1. Resolve `property_id` via `resolveGA4Property()` (fuzzy matching)
2. Default dimensions to `["date"]` if not provided
3. Default metrics to `["sessions", "activeUsers"]` if not provided
4. Default dates to `28daysAgo` / `today`
5. Build the runReport request body
6. Handle `dimension_filter` - transform simplified format to GA4 FilterExpression:
   - If user passes `{fieldName, matchType, value}`, wrap it in proper structure
   - If user passes full FilterExpression, use as-is
7. Handle `order_by` - if starts with `-`, set desc=true and strip the `-`
8. Call the API, parse response, format as readable table
9. Log to usage_logs with service='ga4'

**Filter shorthand transformation:**
When AI sends `{fieldName: "pagePath", matchType: "CONTAINS", value: "/blog/"}`, transform to:
```json
{
  "dimensionFilter": {
    "filter": {
      "fieldName": "pagePath",
      "stringFilter": {
        "matchType": "CONTAINS",
        "value": "/blog/"
      }
    }
  }
}
```

---

### TOOL 3: ga_realtime

**Purpose:** Live data from last 30 minutes
**API:** Data API - runRealtimeReport

```typescript
{
  name: "ga_realtime",
  description: "Get real-time Google Analytics data (last 30 minutes) - active users, live pages, current events",
  inputSchema: {
    type: "object",
    properties: {
      property_id: {
        type: "string",
        description: "GA4 property to query"
      },
      dimensions: {
        type: "array",
        items: { type: "string" },
        description: "Realtime dimensions: 'country', 'city', 'unifiedScreenName', 'deviceCategory', 'eventName', 'platform', 'minutesAgo'"
      },
      metrics: {
        type: "array",
        items: { type: "string" },
        description: "Realtime metrics: 'activeUsers', 'eventCount', 'keyEvents', 'screenPageViews'"
      },
      limit: {
        type: "number",
        description: "Max rows (default 20)"
      }
    },
    required: ["property_id"]
  }
}
```

**Defaults:** dimensions=`["unifiedScreenName"]`, metrics=`["activeUsers"]`, limit=20

---

### TOOL 4: ga_top_pages

**Purpose:** Top pages ranked by chosen metric
**API:** Uses runReport internally

```typescript
{
  name: "ga_top_pages",
  description: "Get top performing pages by sessions, pageviews, engagement rate, or conversions",
  inputSchema: {
    type: "object",
    properties: {
      property_id: { type: "string", description: "GA4 property to query" },
      days: { type: "number", description: "Number of days to analyze (default 28, max 90)", default: 28 },
      sort_by: {
        type: "string",
        enum: ["sessions", "pageviews", "engagement_rate", "bounce_rate", "conversions"],
        description: "Sort metric (default: sessions)",
        default: "sessions"
      },
      limit: { type: "number", description: "Number of pages (default 10, max 100)", default: 10 }
    },
    required: ["property_id"]
  }
}
```

**Implementation:** Internally calls runReport with:
- dimensions: `["pagePath", "pageTitle"]`
- metrics: `["sessions", "activeUsers", "screenPageViews", "engagementRate", "bounceRate", "keyEvents", "averageSessionDuration"]`
- orderBy: mapped from sort_by param (`"pageviews"` -> `"screenPageViews"`, `"conversions"` -> `"keyEvents"`, `"engagement_rate"` -> `"engagementRate"`)

---

### TOOL 5: ga_traffic_sources

**Purpose:** Traffic breakdown by channel/source/medium/campaign
**API:** Uses runReport internally

```typescript
{
  name: "ga_traffic_sources",
  description: "Get traffic source breakdown - where visitors come from (channels, sources, mediums, campaigns)",
  inputSchema: {
    type: "object",
    properties: {
      property_id: { type: "string", description: "GA4 property to query" },
      days: { type: "number", description: "Days to analyze (default 28)", default: 28 },
      group_by: {
        type: "string",
        enum: ["channel", "source", "medium", "source_medium", "campaign"],
        description: "How to group traffic (default: channel)",
        default: "channel"
      },
      limit: { type: "number", description: "Number of sources (default 10)", default: 10 }
    },
    required: ["property_id"]
  }
}
```

**Dimension mapping:**
- `"channel"` -> `"sessionDefaultChannelGroup"`
- `"source"` -> `"sessionSource"`
- `"medium"` -> `"sessionMedium"`
- `"source_medium"` -> `"sessionSourceMedium"`
- `"campaign"` -> `"sessionCampaignName"`

**Metrics:** `["sessions", "activeUsers", "engagementRate", "bounceRate", "keyEvents", "averageSessionDuration"]`

**IMPORTANT:** Use session-scoped source/medium dimensions (prefixed with `session`), NOT event-scoped ones. Session-scoped is correct for traffic analysis.

---

### TOOL 6: ga_conversions

**Purpose:** Key events / conversion data
**API:** Uses runReport internally

```typescript
{
  name: "ga_conversions",
  description: "Get conversion/key event data with optional breakdown by source, page, or country",
  inputSchema: {
    type: "object",
    properties: {
      property_id: { type: "string", description: "GA4 property to query" },
      days: { type: "number", description: "Days to analyze (default 28)", default: 28 },
      breakdown_by: {
        type: "string",
        enum: ["event_name", "source", "medium", "page", "country", "date"],
        description: "Breakdown dimension (optional)"
      },
      limit: { type: "number", description: "Number of rows (default 10)", default: 10 }
    },
    required: ["property_id"]
  }
}
```

**Dimension mapping for breakdown_by:**
- `"event_name"` -> `"eventName"` (with filter: isKeyEvent == "true")
- `"source"` -> `"sessionSource"`
- `"medium"` -> `"sessionMedium"`
- `"page"` -> `"pagePath"`
- `"country"` -> `"country"`
- `"date"` -> `"date"`

**Metrics:** `["keyEvents", "sessions", "activeUsers"]`

**NOTE:** GA4 replaced "conversions" with "key events" (keyEvents). The metric name in the API is `keyEvents`. Use `keyEvents` in all API calls.

---

### TOOL 7: ga_audience

**Purpose:** Demographics, technology, and geographic audience data
**API:** Uses runReport internally

```typescript
{
  name: "ga_audience",
  description: "Get audience demographics, technology, or geographic data",
  inputSchema: {
    type: "object",
    properties: {
      property_id: { type: "string", description: "GA4 property to query" },
      days: { type: "number", description: "Days to analyze (default 28)", default: 28 },
      report_type: {
        type: "string",
        enum: ["demographics", "technology", "geo"],
        description: "Type of audience report (default: geo)",
        default: "geo"
      },
      limit: { type: "number", description: "Number of rows (default 10)", default: 10 }
    },
    required: ["property_id"]
  }
}
```

**Report type dimensions/metrics:**

demographics:
- dimensions: `["userAgeBracket", "userGender"]`
- metrics: `["activeUsers", "sessions", "engagementRate"]`

technology:
- dimensions: `["browser", "deviceCategory", "operatingSystem"]`
- metrics: `["activeUsers", "sessions", "engagementRate"]`

geo:
- dimensions: `["country", "city"]`
- metrics: `["activeUsers", "sessions", "engagementRate", "keyEvents"]`

---

### TOOL 8: ga_page_performance

**Purpose:** Deep dive into a specific page's performance
**API:** Uses runReport with pagePath filter

```typescript
{
  name: "ga_page_performance",
  description: "Get detailed performance metrics for a specific page URL",
  inputSchema: {
    type: "object",
    properties: {
      property_id: { type: "string", description: "GA4 property to query" },
      page_path: { type: "string", description: "Page URL path to analyze (partial match supported, e.g., '/blog/my-post')" },
      days: { type: "number", description: "Days to analyze (default 28)", default: 28 }
    },
    required: ["property_id", "page_path"]
  }
}
```

**Implementation:**
1. Filter by pagePath CONTAINS the user's input
2. Metrics: `["sessions", "activeUsers", "screenPageViews", "engagementRate", "bounceRate", "averageSessionDuration", "keyEvents"]`
3. Also run a second query breaking down by `sessionSource` to show traffic sources for that page
4. Combine both results in the response

**This complements GSC's `get_keyword_for_page` tool.** Users can see keywords (GSC) AND behavior metrics (GA4) for the same page.

---

### TOOL 9: ga_user_journey

**Purpose:** Show landing pages and user flow patterns
**API:** Uses runReport internally

```typescript
{
  name: "ga_user_journey",
  description: "See which pages users land on and how they engage - landing page performance",
  inputSchema: {
    type: "object",
    properties: {
      property_id: { type: "string", description: "GA4 property to query" },
      days: { type: "number", description: "Days to analyze (default 28)", default: 28 },
      limit: { type: "number", description: "Number of pages (default 10)", default: 10 }
    },
    required: ["property_id"]
  }
}
```

**Implementation:**
- dimension: `["landingPagePlusQueryString"]` (or `"landingPage"`)
- metrics: `["sessions", "activeUsers", "engagementRate", "bounceRate", "averageSessionDuration", "keyEvents", "newUsers"]`
- orderBy: sessions descending

---

### TOOL 10: ga_events

**Purpose:** Show event counts and details
**API:** Uses runReport internally

```typescript
{
  name: "ga_events",
  description: "Get event data - see which events are firing and how often",
  inputSchema: {
    type: "object",
    properties: {
      property_id: { type: "string", description: "GA4 property to query" },
      days: { type: "number", description: "Days to analyze (default 28)", default: 28 },
      event_name: { type: "string", description: "Filter to a specific event name (optional)" },
      limit: { type: "number", description: "Number of events (default 20)", default: 20 }
    },
    required: ["property_id"]
  }
}
```

**Implementation:**
- dimension: `["eventName"]`
- metrics: `["eventCount", "totalUsers", "eventCountPerUser"]`
- If event_name is provided, add a dimensionFilter for exact match
- orderBy: eventCount descending

---

## 8. CONSENT SCREEN CHANGES

The OAuth consent screen must be updated to show BOTH GSC properties AND GA4 properties for selection.

### Current Flow (GSC only):
1. User clicks "Connect" -> redirected to Google OAuth
2. After Google auth, redirected to consent page
3. Consent page shows list of GSC properties with checkboxes
4. User selects which properties to connect
5. Selected properties saved to `gsc_properties` with `is_active=true`

### New Flow (GSC + GA4):
1. Same OAuth redirect (now with both scopes)
2. After Google auth, callback page fetches BOTH:
   - GSC properties (existing: `GET https://www.googleapis.com/webmasters/v3/sites`)
   - GA4 properties (new: `GET https://analyticsadmin.googleapis.com/v1beta/accountSummaries`)
3. Consent page shows TWO sections:
   - "Google Search Console Properties" (with checkboxes, existing behavior)
   - "Google Analytics 4 Properties" (with checkboxes, new)
4. User selects from both lists
5. Save GSC selections to `gsc_properties` (existing logic)
6. Save GA4 selections to `ga4_properties` (new)

### BUG WE FIXED IN GSC - DON'T REPEAT IT:
When the consent form submits, you MUST first SET ALL properties `is_active=false` for that user, THEN set selected ones to `true`. The original GSC code just set selected ones to true without deactivating the others, causing ALL properties to show as active.

**Do the same for GA4:**
```sql
-- First deactivate all GA4 properties for this user
UPDATE ga4_properties SET is_active = false WHERE user_id = $1;
-- Then activate only selected ones
UPDATE ga4_properties SET is_active = true WHERE user_id = $1 AND property_id = ANY($2);
```

### Edge Case: User Denies Analytics Scope
If the user only grants GSC scope and denies analytics, the callback should still work for GSC. Check the returned scope in the token response and only show/save GA4 properties if `analytics.readonly` is present.

---

## 9. FUZZY PROPERTY MATCHING FOR GA4

Create a `resolveGA4Property()` function similar to GSC's `resolveSiteUrl()`.

**GA4 property IDs look like:** `"properties/987654321"` with display names like `"nandhini.com"` or `"My Website"`

**Match logic (in order):**
1. **Exact property_id match:** User passes `"properties/987654321"` or `"987654321"`
2. **Display name exact match:** User passes `"nandhini.com"`
3. **Display name partial match:** User passes `"nandhini"` -> matches `"nandhini.com"`
4. **Numeric ID match:** User passes `"987654321"` -> matches `"properties/987654321"`

**Implementation:**
```typescript
async function resolveGA4Property(userInput: string, userId: string): Promise<string | null> {
  // Get all active GA4 properties for this user
  const properties = await db.query(
    'SELECT property_id, display_name FROM ga4_properties WHERE user_id = $1 AND is_active = true',
    [userId]
  );

  if (properties.rows.length === 0) return null;

  // 1. Exact property_id match
  const exactId = properties.rows.find(p =>
    p.property_id === userInput ||
    p.property_id === `properties/${userInput}` ||
    p.property_id.replace('properties/', '') === userInput
  );
  if (exactId) return exactId.property_id;

  // 2. Display name exact match (case-insensitive)
  const exactName = properties.rows.find(p =>
    p.display_name.toLowerCase() === userInput.toLowerCase()
  );
  if (exactName) return exactName.property_id;

  // 3. Display name partial match
  const partial = properties.rows.find(p =>
    p.display_name.toLowerCase().includes(userInput.toLowerCase()) ||
    userInput.toLowerCase().includes(p.display_name.toLowerCase().replace(/\.[a-z]+$/, ''))
  );
  if (partial) return partial.property_id;

  // 4. If only one property, use it
  if (properties.rows.length === 1) return properties.rows[0].property_id;

  return null;
}
```

**When resolution fails:** Return a helpful error listing available properties:
```
"Could not find GA4 property matching 'xyz'. Available properties: nandhini.com (987654321), mysite.com (123456789). Use ga_list_properties to see all options."
```

---

## 10. ERROR HANDLING PATTERNS

### Standard Error Response Format
Follow the exact same format used by GSC tools:
```typescript
return {
  content: [{
    type: "text",
    text: JSON.stringify({
      error: "Human-readable error message",
      details: "Technical details if available"
    })
  }],
  isError: true
};
```

### Common GA4 Errors to Handle

| HTTP Code | Meaning | Response to User |
|-----------|---------|------------------|
| 400 | Bad request (invalid dimension/metric) | "Invalid dimension or metric name: '{name}'. Use ga_run_report with valid GA4 dimension/metric names." |
| 401 | Token expired | Auto-refresh token, retry once. If still fails: "Authentication expired. Please reconnect." |
| 403 | Insufficient scope | "Please reconnect your Google account to enable Analytics access." |
| 403 | No access to property | "You don't have access to this GA4 property." |
| 429 | Rate limited | "GA4 API rate limit reached. Please wait a moment and try again." |
| 500/503 | Server error | "Google Analytics API is temporarily unavailable. Please try again in a minute." |

### Token Refresh
If a GA4 API call returns 401, refresh the token using the refresh_token from `google_credentials` and retry. This should already be implemented for GSC - reuse the same logic.

### Logging
Every GA4 tool call must log to:
1. `usage_logs` table (tool_name, property_id, user_id, source, status, response_time_ms, service='ga4')
2. `mcp_debug_logs` table on errors (service='ga4')
3. File logs (logs/mcp-requests.log, logs/mcp-errors.log) - same format as GSC

---

## 11. COMPLETE GA4 DIMENSIONS REFERENCE

### User / Session Dimensions
- `newVsReturning` - New or returning user
- `firstSessionDate` - Date of user's first visit
- `firstUserCampaignName` - Campaign that first acquired the user
- `firstUserSource` - Source that first acquired the user
- `firstUserMedium` - Medium that first acquired the user
- `firstUserSourceMedium` - Source/medium combo for first acquisition

### Session Source Dimensions (USE THESE for traffic analysis)
- `sessionSource` - Traffic source for the session
- `sessionMedium` - Traffic medium for the session
- `sessionSourceMedium` - Combined source/medium
- `sessionCampaignName` - Campaign name for the session
- `sessionDefaultChannelGroup` - Default channel grouping (Organic Search, Direct, Social, etc.)
- `sessionGoogleAdsAdGroupName` - Google Ads ad group

### Page / Content Dimensions
- `pagePath` - URL path (e.g., /blog/my-post)
- `pageTitle` - HTML page title
- `pagePathPlusQueryString` - Path with query params
- `landingPage` - First page of the session
- `landingPagePlusQueryString` - Landing page with query params
- `contentGroup` - Content group if configured
- `unifiedScreenName` - Page title or screen name (works for web and app)

### Time Dimensions
- `date` - Date (YYYYMMDD format)
- `dateHour` - Date + hour
- `dateHourMinute` - Date + hour + minute
- `dayOfWeek` - 0 (Sunday) to 6 (Saturday)
- `dayOfWeekName` - Sunday, Monday, etc.
- `month` - Month number (01-12)
- `year` - Year (e.g., 2025)
- `hour` - Hour of day (0-23)
- `isoWeek` - ISO week number
- `isoYear` - ISO year
- `isoYearIsoWeek` - ISO year + week
- `nthDay` - Day number since start of date range
- `nthHour` - Hour number since start
- `nthMonth` - Month number since start
- `nthWeek` - Week number since start

### Geographic Dimensions
- `country` - Country name
- `countryId` - ISO country code
- `city` - City name
- `cityId` - City ID
- `continent` - Continent name
- `continentId` - Continent ID
- `region` - Region/state name
- `subContinent` - Sub-continent

### Technology Dimensions
- `browser` - Browser name
- `deviceCategory` - desktop, mobile, tablet
- `deviceModel` - Device model
- `operatingSystem` - OS name
- `operatingSystemVersion` - OS version
- `screenResolution` - Screen resolution
- `language` - User's language
- `platform` - web, ios, android

### Event Dimensions
- `eventName` - Name of the event
- `isKeyEvent` - Whether event is a key event (true/false)

### E-commerce Dimensions
- `itemName` - Product name
- `itemId` - Product ID
- `itemBrand` - Product brand
- `itemCategory` - Product category
- `itemCategory2` through `itemCategory5` - Sub-categories
- `transactionId` - Transaction ID
- `itemListName` - List where item was shown

### Audience Dimensions
- `audienceId` - Audience numeric ID
- `audienceName` - Audience name
- `brandingInterest` - User interests

### Demographics
- `userAgeBracket` - Age range (18-24, 25-34, etc.)
- `userGender` - Gender

---

## 12. COMPLETE GA4 METRICS REFERENCE

### User Metrics
- `activeUsers` - Users with engaged sessions (DEFAULT "Users" in GA4 UI)
- `totalUsers` - Total unique users
- `newUsers` - First-time users
- `returningUsers` - Users who have visited before
- `dauPerMau` - Daily active users / monthly active users
- `dauPerWau` - Daily active users / weekly active users
- `wauPerMau` - Weekly active users / monthly active users

### Session Metrics
- `sessions` - Total sessions
- `sessionsPerUser` - Average sessions per user
- `engagedSessions` - Sessions lasting 10+ seconds, with key event, or 2+ page views
- `engagementRate` - Engaged sessions / total sessions
- `bounceRate` - 1 - engagement rate (non-engaged sessions)
- `averageSessionDuration` - Average session length in seconds
- `sessionKeyEventRate` - Key events per session

### Page / View Metrics
- `screenPageViews` - Total page views
- `screenPageViewsPerSession` - Page views per session
- `screenPageViewsPerUser` - Page views per user
- `userEngagementDuration` - Total engagement time in seconds

### Event Metrics
- `eventCount` - Total events
- `eventCountPerUser` - Events per user
- `eventValue` - Sum of event values
- `keyEvents` - Count of key events (formerly "conversions")
- `totalRevenue` - Total revenue
- `purchaseRevenue` - Purchase revenue

### E-commerce Metrics
- `transactions` - Number of purchases
- `ecommercePurchases` - Number of e-commerce purchases
- `purchaserRate` - Purchasers / active users
- `addToCarts` - Add to cart events
- `checkouts` - Checkout events
- `itemRevenue` - Revenue from items
- `itemsAddedToCart` - Items added to cart
- `itemsCheckedOut` - Items checked out
- `itemsPurchased` - Items purchased
- `itemsViewed` - Items viewed
- `averagePurchaseRevenue` - Average revenue per transaction
- `averagePurchaseRevenuePerUser` - Average revenue per user

### Advertising Metrics
- `publisherAdClicks` - Ad clicks
- `publisherAdImpressions` - Ad impressions
- `totalAdRevenue` - Total ad revenue

---

## 13. TESTING CHECKLIST

### Phase 1: GSC Still Works
After adding GA4 code, verify ALL existing GSC tools work:
- [ ] list_my_properties returns GSC properties
- [ ] get_search_analytics returns search data
- [ ] get_top_keywords returns keywords
- [ ] get_top_pages returns pages
- [ ] get_keyword_for_page returns keywords for a specific page
- [ ] inspect_url returns indexing status
- [ ] list_sitemaps returns sitemaps
- [ ] All other GSC tools working

### Phase 2: GA4 Tools Work
- [ ] ga_list_properties returns GA4 properties
- [ ] ga_run_report returns custom report data
- [ ] ga_realtime returns live data
- [ ] ga_top_pages returns pages ranked by metric
- [ ] ga_traffic_sources returns traffic breakdown
- [ ] ga_conversions returns key event data
- [ ] ga_audience returns audience data
- [ ] ga_page_performance returns page-level metrics
- [ ] ga_user_journey returns landing page data
- [ ] ga_events returns event data

### Phase 3: Edge Cases
- [ ] Fuzzy matching works (e.g., "nandhini" resolves correctly)
- [ ] User with no GA4 properties gets helpful error
- [ ] User with expired token gets auto-refresh
- [ ] User with only GSC scope (no analytics) gets "reconnect" message
- [ ] Rate limit (429) is handled gracefully
- [ ] Invalid dimension/metric names return helpful error
- [ ] Usage logs are populated with service='ga4'
- [ ] Debug logs are populated on errors with service='ga4'

### Phase 4: Both Together (Cross-Service)
- [ ] User can call GSC tool then GA4 tool in same conversation
- [ ] list_my_properties (GSC) and ga_list_properties (GA4) both work
- [ ] Properties don't interfere (GSC URLs vs GA4 property IDs)
- [ ] ChatGPT integration works for GA4 tools (streaming, response format)

---

## 14. DEPLOYMENT STEPS

1. **Run migration** - The start command should run migrations. Add the new SQL migration file.
2. **Update environment** - No new env vars needed (same OAuth credentials)
3. **Push to GitHub** - All changes committed
4. **Railway auto-deploys** from GitHub
5. **Test health endpoint** - `GET /api/health` should still return OK
6. **Test MCP endpoint** - Tools should appear in the list
7. **Reconnect in Claude.ai** - User may need to reconnect to see new tools
8. **Verify on ChatGPT** - If configured, verify GA4 tools appear

---

## 15. KEY GA4 + GSC COMBINED USE CASES

These are high-value scenarios where having BOTH connectors is powerful:

1. **"Which keywords bring clicks but have high bounce rate?"**
   - GSC: get_keyword_for_page -> clicks, impressions, CTR, position
   - GA4: ga_page_performance -> bounce rate, engagement rate, session duration

2. **"Pages with high impressions but low engagement"**
   - GSC: get_top_pages by impressions
   - GA4: ga_top_pages by engagement_rate -> cross-reference

3. **"What's converting from organic search?"**
   - GA4: ga_traffic_sources with channel='Organic Search' + ga_conversions breakdown by page

4. **"Real-time: is my new blog post getting traffic?"**
   - GA4: ga_realtime with unifiedScreenName filter
   - GSC: get_keyword_for_page (delayed, but shows search queries)

5. **"Country-level performance"**
   - GSC: get_search_analytics by country (search visibility)
   - GA4: ga_audience geo report (actual behavior, conversions)

---

## APPENDIX: File Structure for New GA4 Code

Suggested new files (DO NOT modify existing files):

```
src/
  lib/
    ga4/
      api.ts               -- GA4 API client (runReport, runRealtimeReport, Admin API calls)
      resolve-property.ts  -- resolveGA4Property() fuzzy matching
      types.ts             -- GA4 TypeScript types
    mcp/
      tools/
        ga4/
          ga-list-properties.ts
          ga-run-report.ts
          ga-realtime.ts
          ga-top-pages.ts
          ga-traffic-sources.ts
          ga-conversions.ts
          ga-audience.ts
          ga-page-performance.ts
          ga-user-journey.ts
          ga-events.ts
          index.ts           -- exports all GA4 tools
migrations/
  XXX_add_ga4_support.sql    -- Database migration
```

Then in the MCP server setup file (src/lib/mcp/server.ts or similar), import and register the GA4 tools alongside the existing GSC tools. Do NOT remove or restructure the GSC tool imports.
