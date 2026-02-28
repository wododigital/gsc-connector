**PRODUCT REQUIREMENTS DOCUMENT**

**GSC Connect**

Google Search Console to AI Bridge via MCP

Prepared by: WODO Digital

Version: 1.0 \| Date: February 28, 2026

Classification: Internal / For AI Coding Agents

*This document serves as the complete specification for AI coding agents to build the product end-to-end.*

**Table of Contents**

**1. Executive Summary**

GSC Connect is a SaaS product that allows anyone to connect their Google Search Console account to AI assistants (Claude, ChatGPT, Cursor, and others) through the Model Context Protocol (MCP). Users sign up, authenticate with Google, select their GSC properties, and receive a remote MCP server endpoint they can plug into any MCP-compatible AI tool. The AI can then query their search performance data using natural language.

**Product Name:** GSC Connect (working title, to be finalized)

**Product Type:** B2B/B2C SaaS with freemium model

**Target Users:** SEO professionals, digital marketers, agency owners, content creators, webmasters

**Revenue Model:** Freemium with paid tiers (monthly subscription)

**Reference Product:** Ekamoira (app.ekamoira.com) - competitive reference

**2. Problem Statement**

SEO professionals and webmasters need to frequently check their Google Search Console data to understand search performance, identify ranking opportunities, diagnose indexing issues, and track keyword positions. Currently, they have to manually navigate the GSC interface, export CSV files, or write custom scripts to extract this data. AI assistants like Claude and ChatGPT are powerful analysis tools but have no direct access to GSC data. The Model Context Protocol (MCP) bridges this gap by allowing AI tools to call external APIs on behalf of users, but building an MCP server requires significant technical knowledge. GSC Connect eliminates this barrier by providing a hosted, turnkey solution.

**3. User Flow and Experience**

**3.1 Complete User Journey**

The following describes the step-by-step experience from a user\'s perspective:

**Step 1: Landing Page**

User visits the GSC Connect website and sees the value proposition. The landing page explains what the product does, shows a demo of AI querying GSC data, lists supported AI tools (Claude, ChatGPT, Cursor), and has a prominent CTA button: \"Connect Your GSC\".

**Step 2: Account Creation**

User clicks the CTA and is taken to the signup/login page. Options include: \"Continue with Google\" (recommended, since they will need Google auth anyway) or email/password registration. This creates their GSC Connect platform account.

**Step 3: Google OAuth for GSC Access**

After account creation, the user is prompted to connect their Google Search Console. This triggers Google\'s OAuth2 consent flow requesting the webmasters.readonly scope. The user sees Google\'s standard consent screen showing which permissions the app is requesting. Upon approval, the app receives an access token and refresh token which are stored encrypted in the database.

**Step 4: Property Selection**

After Google auth, the app calls the GSC API to fetch all properties the user has access to. A modal/page displays all available properties (both URL-prefix and domain properties) with their permission level (siteOwner, siteFullUser, etc.). IMPORTANT DIFFERENTIATOR: Unlike Ekamoira which only allows one property at a time, GSC Connect should allow users to select MULTIPLE properties. The user confirms their selection.

**Step 5: Dashboard with Connection Details**

The user lands on their dashboard which displays: a success confirmation with the connected property/properties, an API Key (for Claude Desktop and Cursor integration), the MCP Endpoint URL (e.g., https://app.gscconnect.com/mcp), and tabbed setup instructions for each supported platform (Claude.ai, ChatGPT, Claude Desktop, Cursor).

**Step 6: Connecting to Claude.ai**

For Claude.ai specifically: The user goes to Claude.ai Settings, then Connectors, then clicks the \"+\" button to add a custom connector. They paste the MCP endpoint URL and give it a name. They click \"Add\", then \"Connect\". This triggers an OAuth flow where Claude redirects to the GSC Connect consent page. The user logs into their GSC Connect account, selects which property to use for this connection, and authorizes. Claude now has access to the GSC tools.

**Step 7: Using the Tools**

The user can now ask Claude natural language questions like: \"What are my top 10 keywords by clicks?\", \"Which pages have high impressions but low CTR?\", \"Is /products indexed?\", \"Show me search performance for the last 90 days\". Claude uses the MCP tools to fetch real GSC data and provides analysis.

**4. System Architecture**

**4.1 Architecture Overview**

The system consists of five major components that work together. The following describes each component, its responsibility, and how they interact.

  ---------------------------- -------------------------------------------------------------------------------------- -------------------------------------------------------------------------------------------------------------------
  **Component**                **Technology**                                                                         **Responsibility**

  Web Application (Frontend)   Next.js 14+ (App Router), TailwindCSS, deployed on Hostinger VPS                       Landing page, user dashboard, property selector, setup instructions, billing management

  API Backend                  Next.js API Routes or separate Express.js server on Hostinger VPS                      User auth, Google OAuth handling, database operations, token management, billing webhooks

  MCP Server                   Node.js with \@modelcontextprotocol/sdk, runs as persistent process on Hostinger VPS   Handles MCP protocol (Streamable HTTP + SSE), receives tool calls from AI clients, routes to GSC API

  OAuth2 Provider              Custom implementation or oidc-provider library on the same server                      Acts as an authorization server so Claude/ChatGPT can authenticate users via OAuth2 + Dynamic Client Registration

  Database                     PostgreSQL (self-hosted on Hostinger VPS) or Supabase (managed)                        Stores users, encrypted Google tokens, selected properties, API keys, OAuth clients, subscription data
  ---------------------------- -------------------------------------------------------------------------------------- -------------------------------------------------------------------------------------------------------------------

**4.2 Infrastructure: Hostinger VPS**

All services will be deployed on the Hostinger VPS. The VPS should run Ubuntu 22.04+ with the following services: Node.js 20+ (via nvm), PostgreSQL 15+ (or connect to external Supabase), Nginx as reverse proxy with SSL (Let\'s Encrypt), PM2 for process management, and Certbot for SSL certificate auto-renewal.

**Nginx Configuration Overview**

Nginx will serve as a reverse proxy routing traffic to the appropriate services:

-   app.gscconnect.com - proxies to Next.js app (port 3000)

-   app.gscconnect.com/mcp - proxies to MCP server (port 3001) with WebSocket/SSE support

-   app.gscconnect.com/oauth - proxies to OAuth2 provider endpoints

-   gscconnect.com - serves the marketing/landing page (can be same Next.js app)

**4.3 Data Flow Diagram**

The following describes the complete data flow for a typical interaction:

1.  User asks Claude: \"What are my top keywords?\"

2.  Claude sends an MCP tool_call (get_top_keywords) to the MCP endpoint URL with the user\'s OAuth bearer token

3.  MCP server receives the request, validates the bearer token, looks up the associated user in the database

4.  MCP server retrieves the user\'s stored Google refresh token (encrypted) from the database

5.  MCP server uses the Google refresh token to get a fresh access token from Google\'s OAuth2 endpoint

6.  MCP server calls the Google Search Console API (searchanalytics.query) with the fresh access token

7.  Google returns the search analytics data

8.  MCP server formats the response according to MCP protocol and returns it to Claude

9.  Claude presents the analysis to the user in natural language

**5. Detailed Technical Specifications**

**5.1 Authentication System (Dual OAuth)**

The system requires TWO separate OAuth implementations. This is the most critical and complex part of the build. Both must work correctly for the product to function.

**OAuth Flow A: Google OAuth (Your App as OAuth Client)**

This is the standard flow where your app requests access to the user\'s Google Search Console data.

**Purpose:** Get permission to read the user\'s GSC data

**Google OAuth Scopes Required:** https://www.googleapis.com/auth/webmasters.readonly (read-only access to Search Console data), openid email profile (for user identity)

**Token Storage:** Store the refresh_token encrypted (AES-256) in the database. Access tokens expire in 1 hour, so always use the refresh token to get new ones.

**Google API Endpoints Used:** Authorization: https://accounts.google.com/o/oauth2/v2/auth, Token Exchange: https://oauth2.googleapis.com/token, User Info: https://www.googleapis.com/oauth2/v2/userinfo

**OAuth Flow B: Your App as OAuth2 Provider**

This is the flow that allows Claude.ai and ChatGPT to authenticate users of YOUR platform. When a user clicks \"Connect\" in Claude\'s custom connector settings, Claude needs to verify who the user is on YOUR platform. Your app must act as a full OAuth2 authorization server.

**Required Endpoints:**

-   GET /.well-known/oauth-authorization-server - Returns server metadata (issuer, authorization_endpoint, token_endpoint, registration_endpoint, etc.)

-   POST /oauth/register - Dynamic Client Registration (RFC 7591). Claude will call this to register itself as a client of your OAuth server. Returns client_id and client_secret.

-   GET /oauth/authorize - Authorization endpoint. Shows consent page where user logs in and selects a GSC property. Returns authorization code.

-   POST /oauth/token - Token endpoint. Exchanges authorization code for access_token and refresh_token. Also handles token refresh.

Claude supports both the March 2025 and June 2025 MCP auth specs. It also supports Dynamic Client Registration (DCR). Your server MUST support DCR for seamless Claude.ai integration.

**5.2 MCP Server Specification**

The MCP server is the core product. It speaks the Model Context Protocol and exposes GSC functionality as tools that AI assistants can call.

**Transport**

Support both Streamable HTTP and SSE transports. Claude.ai uses Streamable HTTP primarily. Claude Desktop may use SSE. The MCP TypeScript SDK (@modelcontextprotocol/sdk) handles both transports.

**Required MCP Protocol Compliance**

-   HEAD / endpoint returning MCP-Protocol-Version: 2025-06-18 header

-   POST / for tool calls (Streamable HTTP)

-   GET /sse for SSE transport (legacy, but keep for compatibility)

-   Mcp-Session-Id header support for session management

-   Proper HTTP status codes: 405 (Method Not Allowed with Allow header) for unsupported methods, not 501

-   Authentication middleware that validates OAuth bearer tokens on every request

**MCP Tools to Implement**

The following 13 tools should be implemented. Each tool maps to one or more Google Search Console API calls:

  -------------------------- --------------------------------------------------------------------------------------------------------------------- --------------------------------------------------------
  **Tool Name**              **Description**                                                                                                       **GSC API Method**

  get_search_analytics       Get search performance data (clicks, impressions, CTR, position) with flexible date ranges, dimensions, and filters   searchAnalytics.query

  get_top_keywords           List top keywords sorted by clicks, impressions, CTR, or position                                                     searchAnalytics.query (dimension: query)

  get_top_pages              List top performing pages sorted by clicks, impressions, CTR, or position                                             searchAnalytics.query (dimension: page)

  get_keyword_for_page       See which keywords drive traffic to a specific page URL                                                               searchAnalytics.query (filter: page, dimension: query)

  inspect_url                Check the indexing status and coverage of a specific URL                                                              urlInspection.index.inspect

  list_sitemaps              List all sitemaps submitted for the site                                                                              sitemaps.list

  get_sitemap                Get details about a specific sitemap                                                                                  sitemaps.get

  submit_sitemap             Submit a new sitemap URL                                                                                              sitemaps.submit

  delete_sitemap             Remove a sitemap                                                                                                      sitemaps.delete

  list_sites                 List all sites the user has access to in GSC                                                                          sites.list

  add_site                   Add a new site to GSC (requires verification)                                                                         sites.add

  delete_site                Remove a site from GSC                                                                                                sites.delete

  run_mobile_friendly_test   Test if a URL is mobile-friendly                                                                                      urlTestingTools.mobileFriendlyTest.run
  -------------------------- --------------------------------------------------------------------------------------------------------------------- --------------------------------------------------------

**Tool Parameter Schemas**

Each tool must have a well-defined JSON Schema for its parameters. Here is the schema specification for the most important tools:

get_search_analytics: This is the most powerful and flexible tool. Parameters should include: days (number, 1-540, default 28), dimensions (array of: query/page/date/country/device, default \[\"query\"\]), filters (object with optional query/page/country string filters), row_limit (number, 1-25000, default 100), start_date and end_date (optional ISO date strings that override \'days\').

get_top_keywords: Parameters include days (1-90, default 28), limit (1-100, default 10), sort_by (enum: clicks/impressions/ctr/position, default clicks).

get_top_pages: Same parameter structure as get_top_keywords.

get_keyword_for_page: Parameters include page_url (required string), days (1-90, default 28), limit (1-100, default 20).

inspect_url: Single parameter url (required string, must be on verified property).

**5.3 Database Schema**

Use PostgreSQL. The following tables are required:

**Table: users**

  -------------------- --------------------- -------------------------------------
  **Column**           **Type**              **Notes**

  id                   UUID (PK)             Generated, primary key

  email                VARCHAR(255)          Unique, from Google or email signup

  name                 VARCHAR(255)          Optional display name

  google_id            VARCHAR(255)          Google OAuth subject ID, nullable

  password_hash        VARCHAR(255)          For email/password users, nullable

  created_at           TIMESTAMP             Auto-generated

  updated_at           TIMESTAMP             Auto-updated

  subscription_tier    VARCHAR(50)           free / pro / agency

  stripe_customer_id   VARCHAR(255)          For billing
  -------------------- --------------------- -------------------------------------

**Table: google_credentials**

  ------------------------- ---------------- ---------------------------------
  **Column**                **Type**         **Notes**

  id                        UUID (PK)        Generated

  user_id                   UUID (FK)        References users.id

  google_email              VARCHAR(255)     The Google account email

  access_token_encrypted    TEXT             AES-256 encrypted

  refresh_token_encrypted   TEXT             AES-256 encrypted

  token_expiry              TIMESTAMP        When access token expires

  scopes                    TEXT             Granted scopes

  created_at                TIMESTAMP        Auto-generated

  updated_at                TIMESTAMP        Auto-updated
  ------------------------- ---------------- ---------------------------------

**Table: gsc_properties**

  ------------------ ---------------- -----------------------------------------------------------------
  **Column**         **Type**         **Notes**

  id                 UUID (PK)        Generated

  user_id            UUID (FK)        References users.id

  credential_id      UUID (FK)        References google_credentials.id

  site_url           VARCHAR(500)     e.g., https://example.com/ or sc-domain:example.com

  permission_level   VARCHAR(50)      siteOwner, siteFullUser, siteRestrictedUser, siteUnverifiedUser

  is_active          BOOLEAN          Whether currently selected for MCP access

  created_at         TIMESTAMP        Auto-generated
  ------------------ ---------------- -----------------------------------------------------------------

**Table: api_keys**

  ---------------- ---------------- -----------------------------------------------------
  **Column**       **Type**         **Notes**

  id               UUID (PK)        Generated

  user_id          UUID (FK)        References users.id

  key_hash         VARCHAR(255)     SHA-256 hash of the API key (never store plaintext)

  key_prefix       VARCHAR(20)      First 8 chars for display (e.g., gsc_live_7203\...)

  name             VARCHAR(255)     User-defined label

  is_active        BOOLEAN          Can be revoked

  last_used_at     TIMESTAMP        For analytics

  created_at       TIMESTAMP        Auto-generated
  ---------------- ---------------- -----------------------------------------------------

**Table: oauth_clients**

  -------------------- ------------------ -----------------------------------------------------
  **Column**           **Type**           **Notes**

  id                   UUID (PK)          Generated

  client_id            VARCHAR(255)       Unique, issued during DCR

  client_secret_hash   VARCHAR(255)       Hashed client secret

  client_name          VARCHAR(255)       e.g., \'Claude.ai\'

  redirect_uris        TEXT\[\]           Array of allowed redirect URIs

  grant_types          TEXT\[\]           e.g., \[\'authorization_code\', \'refresh_token\'\]

  created_at           TIMESTAMP          Auto-generated
  -------------------- ------------------ -----------------------------------------------------

**Table: oauth_tokens**

  -------------------- ------------------ ------------------------------------------------
  **Column**           **Type**           **Notes**

  id                   UUID (PK)          Generated

  user_id              UUID (FK)          References users.id

  client_id            VARCHAR(255)       The OAuth client this token was issued to

  access_token_hash    VARCHAR(255)       Hashed bearer token

  refresh_token_hash   VARCHAR(255)       Hashed refresh token

  property_id          UUID (FK)          Which GSC property this token grants access to

  scopes               TEXT               Granted scopes

  expires_at           TIMESTAMP          Token expiry

  created_at           TIMESTAMP          Auto-generated
  -------------------- ------------------ ------------------------------------------------

**Table: oauth_authorization_codes**

  ----------------------- ------------------ ---------------------------------
  **Column**              **Type**           **Notes**

  id                      UUID (PK)          Generated

  code_hash               VARCHAR(255)       Hashed authorization code

  user_id                 UUID (FK)          References users.id

  client_id               VARCHAR(255)       The requesting OAuth client

  redirect_uri            VARCHAR(500)       Must match on token exchange

  property_id             UUID (FK)          Selected GSC property

  code_challenge          VARCHAR(255)       For PKCE support

  code_challenge_method   VARCHAR(10)        S256

  expires_at              TIMESTAMP          Short-lived, 10 min max

  used                    BOOLEAN            One-time use enforcement
  ----------------------- ------------------ ---------------------------------

**6. Accounts and Platforms Required**

The following accounts must be created and configured before development begins:

  -------------------------- ------------------------------------------------------------------------------------------------------------------------------- --------------------------------------------- ---------------------
  **Account/Platform**       **Purpose**                                                                                                                     **Cost**                                      **Setup Priority**

  Google Cloud Console       Create OAuth2 credentials (client ID + secret) for GSC API access. Enable Search Console API. Configure OAuth consent screen.   Free (GSC API has no usage costs)             CRITICAL - Do first

  Hostinger VPS              Already available. Host all services: Next.js app, MCP server, PostgreSQL, Nginx.                                               Already owned                                 CRITICAL

  Domain Name                Register gscconnect.com or similar. Point DNS to Hostinger VPS.                                                                 \~\$10-15/year                                CRITICAL

  Anthropic API              For any LLM-powered features in the dashboard (e.g., AI-generated SEO insights, smart suggestions)                              \$0 to start, pay per usage                   MEDIUM

  Stripe                     Payment processing for subscription tiers. Provides webhooks for subscription lifecycle.                                        No upfront cost, 2.9% + 30c per transaction   MEDIUM - After MVP

  Supabase (optional)        Alternative to self-hosted PostgreSQL. Provides managed DB + auth helpers + row-level security.                                 Free tier (500MB, 50K monthly active users)   OPTIONAL

  GitHub                     Version control, CI/CD pipelines                                                                                                Free                                          HIGH

  Let\'s Encrypt / Certbot   SSL certificates for all domains                                                                                                Free                                          CRITICAL

  Resend or Postmark         Transactional emails (welcome, password reset, billing)                                                                         Free tier available                           MEDIUM

  Sentry                     Error monitoring and alerting                                                                                                   Free tier (5K events/month)                   MEDIUM
  -------------------------- ------------------------------------------------------------------------------------------------------------------------------- --------------------------------------------- ---------------------

**6.1 Google Cloud Console Setup (Detailed)**

This is the most important external setup. Follow these steps precisely:

1.  Go to console.cloud.google.com and create a new project called \"GSC Connect\"

2.  Navigate to APIs & Services, then Library. Search for and enable: \"Google Search Console API\" and \"Google Search Console URL Testing Tools API\"

3.  Go to APIs & Services, then OAuth consent screen. Choose \"External\" user type. Fill in app name, support email, developer contact email. Add scopes: openid, email, profile, and https://www.googleapis.com/auth/webmasters.readonly

4.  Go to APIs & Services, then Credentials. Click \"Create Credentials\", then \"OAuth client ID\". Choose \"Web application\". Add authorized redirect URI: https://app.gscconnect.com/auth/google/callback

5.  Download the client ID and client secret. Store securely in environment variables, never in code.

6.  IMPORTANT: The webmasters.readonly scope is classified as \"sensitive\" by Google. For production (more than 100 users), you MUST submit for Google OAuth verification. This requires a privacy policy page, terms of service, and a video demo of the OAuth flow. Plan 2-6 weeks for approval.

**7. Technology Stack**

  -------------------- ------------------------------------------------------- ------------------------------------------------------------------------------
  **Layer**            **Technology**                                          **Rationale**

  Frontend Framework   Next.js 14+ (App Router)                                SSR for landing page SEO, API routes for backend, React for dashboard

  Styling              TailwindCSS + shadcn/ui                                 Fast development, consistent dark theme to match GSC Connect brand

  MCP Server           \@modelcontextprotocol/sdk (TypeScript)                 Official Anthropic SDK, handles protocol compliance, transport negotiation

  Database             PostgreSQL 15+                                          Reliable, supports JSON columns, excellent for relational data

  ORM                  Prisma or Drizzle ORM                                   Type-safe database queries, migration management

  Authentication       Custom OAuth2 implementation using jose (JWT) library   Need full control for OAuth2 Provider; jose handles JWT signing/verification

  Session Management   iron-session or JWT-based sessions                      Lightweight, works with Next.js

  Encryption           Node.js crypto module (AES-256-GCM)                     For encrypting stored Google refresh tokens

  Process Manager      PM2                                                     Keeps Node.js processes alive, handles restarts, log management

  Reverse Proxy        Nginx                                                   SSL termination, routing, rate limiting, WebSocket/SSE proxying

  LLM Integration      Anthropic API (Claude Sonnet)                           For AI-powered dashboard features and SEO insights

  Payments             Stripe                                                  Subscription management, webhooks, customer portal

  Email                Resend                                                  Transactional emails with React Email templates
  -------------------- ------------------------------------------------------- ------------------------------------------------------------------------------

**8. API Endpoints Specification**

**8.1 Authentication Endpoints**

  ------------ --------------------------- --------------------------------------------------
  **Method**   **Path**                    **Description**

  POST         /api/auth/signup            Create account with email/password

  POST         /api/auth/login             Login with email/password, returns session

  GET          /api/auth/google            Initiates Google OAuth flow (for platform login)

  GET          /api/auth/google/callback   Google OAuth callback, creates/links account

  POST         /api/auth/logout            Destroy session

  GET          /api/auth/me                Get current authenticated user
  ------------ --------------------------- --------------------------------------------------

**8.2 GSC Connection Endpoints**

  ------------ ---------------------------- ---------------------------------------------------
  **Method**   **Path**                     **Description**

  GET          /api/gsc/connect             Initiates Google OAuth specifically for GSC scope

  GET          /api/gsc/callback            Handles Google OAuth callback, stores tokens

  GET          /api/gsc/properties          Lists all GSC properties available to the user

  POST         /api/gsc/properties/select   User selects which properties to activate

  DELETE       /api/gsc/disconnect          Revokes Google tokens and removes connection
  ------------ ---------------------------- ---------------------------------------------------

**8.3 OAuth2 Provider Endpoints (for Claude/ChatGPT)**

  ------------ ----------------------------------------- --------------------------------------------------------------
  **Method**   **Path**                                  **Description**

  GET          /.well-known/oauth-authorization-server   Server metadata discovery (RFC 8414)

  POST         /oauth/register                           Dynamic Client Registration (RFC 7591)

  GET          /oauth/authorize                          Authorization endpoint - shows consent UI

  POST         /oauth/token                              Token endpoint - exchanges code for tokens, refreshes tokens

  POST         /oauth/revoke                             Token revocation
  ------------ ----------------------------------------- --------------------------------------------------------------

**8.4 MCP Protocol Endpoints**

  ------------ ------------------------ -------------------------------------------------------------------
  **Method**   **Path**                 **Description**

  HEAD         /mcp                     Returns MCP-Protocol-Version header

  POST         /mcp                     Streamable HTTP transport - receives and responds to MCP messages

  GET          /mcp/sse                 SSE transport (legacy) - establishes event stream

  POST         /mcp/sse                 SSE transport message endpoint
  ------------ ------------------------ -------------------------------------------------------------------

**8.5 Dashboard API Endpoints**

  ------------ ------------------------------ ---------------------------------------------------------
  **Method**   **Path**                       **Description**

  GET          /api/dashboard                 User dashboard data (connected properties, usage stats)

  GET          /api/keys                      List API keys

  POST         /api/keys                      Generate new API key

  DELETE       /api/keys/:id                  Revoke an API key

  GET          /api/usage                     Usage statistics and limits

  POST         /api/billing/create-checkout   Create Stripe checkout session

  POST         /api/billing/webhook           Stripe webhook handler

  GET          /api/billing/portal            Redirect to Stripe customer portal
  ------------ ------------------------------ ---------------------------------------------------------

**9. Security Requirements**

Security is paramount since the product handles Google API credentials. The following requirements are non-negotiable:

-   All Google refresh tokens MUST be encrypted at rest using AES-256-GCM. The encryption key must be stored as an environment variable, never in code or database.

-   API keys are stored as SHA-256 hashes only. The plaintext key is shown to the user exactly once at creation time.

-   OAuth authorization codes must be single-use and expire within 10 minutes.

-   All OAuth bearer tokens must be validated on every MCP request. No exceptions.

-   HTTPS everywhere. No HTTP endpoints in production.

-   CORS must be configured strictly. Only allow origins from your own domain and the AI tool domains.

-   Rate limiting: Apply rate limits at the Nginx level and application level. Suggested: 100 requests/minute per user for MCP tools, 10 requests/minute for auth endpoints.

-   SQL injection prevention: Use parameterized queries via ORM (Prisma/Drizzle). Never concatenate user input into queries.

-   PKCE support: The OAuth2 provider MUST support PKCE (Proof Key for Code Exchange) as Claude uses it.

-   Token rotation: Issue new refresh tokens on each use and invalidate the old ones.

-   Input validation: Validate all tool parameters against their JSON schemas before making GSC API calls.

-   Audit logging: Log all authentication events, token exchanges, and API key operations.

**10. Key Differentiators vs Ekamoira**

The following features differentiate GSC Connect from the reference product:

  -------------------------- -------------------------------- -----------------------------------------------------------------------------------------------------------------------
  **Feature**                **Ekamoira**                     **GSC Connect**

  Multi-property selection   Single property per connection   Select multiple properties, switch between them in AI context

  ChatGPT native support     Supported                        Supported, same OAuth2 setup works for both Claude and ChatGPT

  AI-powered insights        Not available                    Dashboard shows AI-generated SEO insights using Anthropic API (e.g., weekly performance summaries, anomaly detection)

  Usage analytics            Basic                            Detailed usage dashboard showing which tools are called most, query patterns, daily/weekly trends

  Team/agency features       Not available                    Agency tier: manage multiple client GSC properties under one account, share MCP connections with team members

  Pricing                    30-day free trial then paid      Generous free tier (1 property, 100 queries/day), Pro tier for more
  -------------------------- -------------------------------- -----------------------------------------------------------------------------------------------------------------------

**11. Pricing Tiers**

  --------------------------------- ---------------------- ------------------- ----------------------------------
  **Feature**                       **Free**               **Pro (\$19/mo)**   **Agency (\$49/mo)**

  GSC Properties                    1                      5                   25

  Daily MCP Queries                 100                    2,000               10,000

  AI Insights (via Anthropic API)   No                     Weekly summaries    Daily summaries + anomaly alerts

  API Keys                          1                      5                   20

  Team Members                      1                      1                   5

  Support                           Community              Email               Priority email

  Data Retention                    7 days query history   90 days             365 days
  --------------------------------- ---------------------- ------------------- ----------------------------------

**12. Development Phases and Milestones**

**Phase 1: Foundation (Week 1-2)**

-   Set up Hostinger VPS: Install Node.js, PostgreSQL, Nginx, PM2, Certbot

-   Set up domain and SSL certificates

-   Initialize Next.js project with TailwindCSS and shadcn/ui

-   Create database schema and run migrations (Prisma)

-   Implement user authentication (email/password + Google OAuth login)

-   Build the Google OAuth flow for GSC scope (connect GSC, store encrypted tokens)

-   Build property listing and selection UI

**Phase 2: MCP Server (Week 2-3)**

-   Set up MCP server using \@modelcontextprotocol/sdk

-   Implement all 13 GSC tools with proper parameter validation

-   Build the Google token refresh logic (auto-refresh expired access tokens)

-   Implement API key authentication for Claude Desktop / Cursor

-   Test all tools using MCP Inspector

-   Configure Nginx for SSE/Streamable HTTP proxying

**Phase 3: OAuth2 Provider (Week 3-4)**

-   Implement /.well-known/oauth-authorization-server metadata endpoint

-   Implement Dynamic Client Registration (POST /oauth/register)

-   Build the authorization consent page (login + property selector)

-   Implement authorization code grant flow with PKCE

-   Implement token endpoint (code exchange + refresh)

-   Test end-to-end with Claude.ai custom connector

-   Test with ChatGPT custom actions (if available)

**Phase 4: Dashboard and Polish (Week 4-5)**

-   Build user dashboard with connection status, usage stats

-   Build API key management UI (create, view prefix, revoke)

-   Build setup instruction tabs (Claude.ai, ChatGPT, Claude Desktop, Cursor)

-   Build the landing page with product demo

-   Implement rate limiting (Nginx + application level)

-   Add error handling and user-friendly error messages

**Phase 5: Monetization and Growth (Week 5-7)**

-   Integrate Stripe for subscription billing

-   Implement usage tracking and enforce tier limits

-   Build AI-powered insights feature using Anthropic API

-   Build admin panel for user management

-   Submit Google OAuth app for verification (plan 2-6 weeks for approval)

-   Launch marketing site and begin outreach

**13. Environment Variables**

The following environment variables must be configured on the VPS. Create a .env file (NEVER commit to git) and load via dotenv or PM2 ecosystem config:

**Application**

> NODE_ENV=production
>
> APP_URL=https://app.gscconnect.com
>
> APP_SECRET=\<random-64-char-hex-string\>
>
> ENCRYPTION_KEY=\<random-32-byte-hex-for-aes-256\>

**Database**

> DATABASE_URL=postgresql://user:password@localhost:5432/gscconnect

**Google OAuth**

> GOOGLE_CLIENT_ID=\<from-google-cloud-console\>
>
> GOOGLE_CLIENT_SECRET=\<from-google-cloud-console\>
>
> GOOGLE_REDIRECT_URI=https://app.gscconnect.com/api/gsc/callback

**Anthropic**

> ANTHROPIC_API_KEY=\<your-anthropic-api-key\>

**Stripe**

> STRIPE_SECRET_KEY=\<stripe-secret-key\>
>
> STRIPE_WEBHOOK_SECRET=\<stripe-webhook-signing-secret\>
>
> STRIPE_PRO_PRICE_ID=\<price_id-for-pro-tier\>
>
> STRIPE_AGENCY_PRICE_ID=\<price_id-for-agency-tier\>

**Email**

> RESEND_API_KEY=\<resend-api-key\>
>
> FROM_EMAIL=hello@gscconnect.com

**14. Recommended Project Structure**

> gsc-connect/
>
> src/
>
> app/ \# Next.js App Router pages
>
> (marketing)/ \# Landing page, pricing, docs
>
> (dashboard)/ \# Authenticated dashboard pages
>
> api/ \# API route handlers
>
> auth/ \# Auth endpoints
>
> gsc/ \# GSC connection endpoints
>
> keys/ \# API key management
>
> billing/ \# Stripe endpoints
>
> oauth/ \# OAuth2 provider pages
>
> authorize/ \# Consent page
>
> lib/ \# Shared utilities
>
> db.ts \# Database client (Prisma)
>
> encryption.ts \# AES-256 encrypt/decrypt
>
> google-api.ts \# Google OAuth + GSC API helpers
>
> auth.ts \# Session/JWT management
>
> mcp/ \# MCP server (separate entry point)
>
> server.ts \# MCP server setup + transport
>
> tools/ \# Tool implementations
>
> search-analytics.ts
>
> url-inspection.ts
>
> sitemaps.ts
>
> sites.ts
>
> mobile-friendly.ts
>
> middleware/ \# Auth middleware for MCP
>
> components/ \# React components
>
> styles/ \# Global styles
>
> prisma/
>
> schema.prisma \# Database schema
>
> migrations/ \# Migration files
>
> public/ \# Static assets
>
> nginx/ \# Nginx config files
>
> ecosystem.config.js \# PM2 config
>
> .env \# Environment variables (git-ignored)

**15. Testing Strategy**

**15.1 MCP Server Testing**

Use the official MCP Inspector tool (npx \@modelcontextprotocol/inspector) to test each tool individually before integrating with Claude. The inspector lets you connect to your MCP server, see available tools, and call them with test parameters.

**15.2 OAuth2 Testing**

Test the full OAuth2 flow using a manual browser walkthrough: call the authorization endpoint, complete login, get the code, exchange it for tokens. Then test with Claude.ai by adding as a custom connector. Common failure points: incorrect redirect URIs, missing PKCE support, expired authorization codes, incorrect content-type on token endpoint.

**15.3 Integration Testing**

After connecting to Claude.ai, test every tool with natural language queries. Document the expected responses and verify data accuracy against the GSC web interface.

**16. Known Challenges and Mitigations**

  --------------------------------------------------- ---------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------
  **Challenge**                                       **Impact**                         **Mitigation**

  Google OAuth verification required for 100+ users   Blocks public launch               Submit early in Phase 1. Prepare privacy policy, ToS, and demo video. Use \"Testing\" mode for initial development (allows 100 test users).

  OAuth2 Provider is complex to build correctly       Core feature blocker               Use the MCP TypeScript SDK auth examples as reference. Test extensively with MCP Inspector before Claude integration.

  SSE connections through Nginx need special config   MCP transport may fail             Configure proxy_buffering off, proxy_set_header Connection \'\', and appropriate timeouts in Nginx.

  Google refresh tokens can be revoked by users       Tools stop working silently        Implement token health checks. Detect 401 from Google and notify user to re-authenticate.

  Rate limits on Google Search Console API            May hit limits for heavy users     Implement caching layer (Redis or in-memory) for frequently accessed data. Cache search analytics results for 1 hour.

  Claude DCR compliance                               Custom connector may not connect   Follow the MCP auth spec precisely. Test DCR flow manually. Check Claude\'s support docs for latest requirements.
  --------------------------------------------------- ---------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------

**17. Pre-Launch Checklist**

-   All 13 MCP tools working and tested via MCP Inspector

-   OAuth2 Provider working with Claude.ai custom connector end-to-end

-   Google OAuth verification submitted (or in \"Testing\" mode for soft launch)

-   SSL certificates installed and auto-renewing

-   Database backups configured (daily automated backups)

-   Error monitoring set up (Sentry)

-   Rate limiting configured at Nginx and application level

-   Privacy policy and Terms of Service pages published

-   Landing page live with clear value proposition and demo

-   Stripe billing integration tested with test cards

-   PM2 configured for auto-restart on crash

-   Nginx configured for SSE/WebSocket proxying

-   All environment variables set and .env excluded from git

-   README with deployment instructions for the team

**18. Glossary**

  ------------------ --------------------------------------------------------------------------------------------------------------------------------
  **Term**           **Definition**

  MCP                Model Context Protocol - an open standard by Anthropic that allows AI assistants to connect to external tools and data sources

  SSE                Server-Sent Events - a protocol for one-way server-to-client streaming over HTTP

  DCR                Dynamic Client Registration (RFC 7591) - allows OAuth clients to register themselves programmatically

  PKCE               Proof Key for Code Exchange - a security extension to OAuth2 that prevents authorization code interception

  GSC                Google Search Console - Google\'s tool for monitoring website search performance

  OAuth2 Provider    A server that issues access tokens to third-party applications after user consent

  OAuth2 Client      An application that requests access to resources on behalf of a user (e.g., your app requesting GSC data from Google)

  Refresh Token      A long-lived token used to obtain new access tokens without re-prompting the user

  Bearer Token       An access token sent in the Authorization header of HTTP requests

  VPS                Virtual Private Server - a virtual machine provided by hosting companies like Hostinger
  ------------------ --------------------------------------------------------------------------------------------------------------------------------

**End of Document**

*GSC Connect PRD v1.0 - Prepared for AI Coding Agents - WODO Digital*
