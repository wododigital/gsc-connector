# GSC Connect - Claude Flow Swarm Prompt

## Step 0: Read Everything First
Before ANY work begins, every agent must read ALL files in this project:
- `PRD.md` (Product Requirements Document - the complete product spec)
- `CLAUDE.md` (project conventions)
- `RUFLO_SETUP.md` (swarm setup guide)
- `src/server.ts` (MCP server scaffold with 13 tool definitions)
- `src/oauth-provider.ts` (OAuth2 provider scaffold)
- `src/lib/google-api.ts` (Google Search Console API helpers)
- `src/lib/encryption.ts` (AES-256 encryption utilities)
- `prisma/schema.prisma` (complete database schema)

Do NOT start coding until you have read and understood every file.

---

## Step 1: Set Up the Development Team Swarm

Create these agents with the specified roles. Each agent OWNS specific directories and should NOT modify files outside their ownership unless coordinated through the Project Manager.

### Agent Roles and File Ownership

| Agent | Role | Owns These Directories/Files |
|-------|------|------------------------------|
| **PM** | Project Manager | `/docs/`, task tracking, progress reports |
| **Architect** | System Architect | `/src/types/`, `/src/interfaces/`, `/src/config/`, architecture decision docs |
| **Coder-MCP** | MCP Tools Developer | `/src/mcp/`, `/src/mcp/tools/`, `/src/mcp/middleware/` |
| **Coder-OAuth** | OAuth2 Provider Developer | `/src/oauth/`, `/src/oauth/routes/`, consent page logic |
| **Coder-Frontend** | Frontend Developer | `/src/app/`, `/src/components/`, `/src/styles/`, all Next.js pages |
| **Coder-Infra** | Infrastructure & DB Developer | `/prisma/`, `/scripts/`, `.env.example`, `docker-compose.yml`, PM2 config, project root configs |
| **QA** | Quality Assurance Tester | `/tests/`, `/scripts/test-*.sh`, test reports |
| **Security** | Security Reviewer | Security audit reports, reviews PRs from other agents |

### Model Assignment (Cost Efficiency)
- **Opus**: Architect only (complex design decisions, interface design)
- **Sonnet**: Coder-MCP, Coder-OAuth, Coder-Frontend, Security (all coding tasks)
- **Haiku**: PM, Coder-Infra, QA (task tracking, config files, test scripts)

---

## Step 2: Build Phases (STRICTLY SEQUENTIAL)

The PM MUST enforce this build order. No phase starts until the previous phase is verified complete.

### Phase 1: Foundation (Coder-Infra + Architect)
**Must complete before any other coding starts.**

Tasks for **Architect**:
1. Define all TypeScript interfaces in `/src/types/index.ts`: User, GoogleCredential, GscProperty, ApiKey, OAuthClient, OAuthToken, MCPToolResponse
2. Define shared error types and error handling pattern (all agents must follow this)
3. Define the config module `/src/config/index.ts` that reads env vars with validation
4. Document architecture decisions in `/docs/architecture.md`

Tasks for **Coder-Infra**:
1. Create `.env.example` with ALL required variables (see PRD Section 13)
2. Create `docker-compose.yml` with PostgreSQL 15 (port 5432, db: gscconnect, user: gscconnect)
3. Run `npx prisma migrate dev --name init` to create all tables from the existing schema
4. Create `scripts/setup.sh` that installs deps, creates .env from example, runs migrations
5. Create `ecosystem.config.js` for PM2 with two processes: `gsc-web` (port 3000) and `gsc-mcp` (port 3001)
6. Verify: PostgreSQL is running, migrations applied, both ports respond

**Phase 1 Definition of Done**: `npm run dev` starts both services, Prisma can connect to DB, all TypeScript interfaces compile.

---

### Phase 2: MCP Server Core (Coder-MCP)
**Depends on: Phase 1 complete**

Tasks:
1. Create `/src/mcp/server.ts` - Initialize MCP server using @modelcontextprotocol/sdk
2. Create `/src/mcp/transport.ts` - Set up Streamable HTTP transport on port 3001
3. Create `/src/mcp/middleware/auth.ts` - Middleware that extracts bearer token from Authorization header, looks up user in oauth_tokens table, attaches user context
4. Create `/src/mcp/helpers/gsc-client.ts` - Wrapper that handles token refresh automatically: takes user_id, returns authenticated GSC API client
5. Implement all 13 tools in separate files under `/src/mcp/tools/`:
   - `search-analytics.ts` (get_search_analytics)
   - `top-keywords.ts` (get_top_keywords)
   - `top-pages.ts` (get_top_pages)
   - `keyword-for-page.ts` (get_keyword_for_page)
   - `url-inspection.ts` (inspect_url)
   - `sitemaps.ts` (list_sitemaps, get_sitemap, submit_sitemap, delete_sitemap)
   - `sites.ts` (list_sites, add_site, delete_site)
   - `mobile-friendly.ts` (run_mobile_friendly_test)
6. Each tool must: validate params with Zod, call GSC API via the helper, format response as MCP content blocks, handle errors gracefully with user-friendly messages

**Phase 2 Definition of Done**: MCP Inspector (npx @modelcontextprotocol/inspector) can connect to localhost:3001, list all 13 tools, and call each one (with mock/test data if no real GSC credentials yet).

---

### Phase 3: OAuth2 Provider (Coder-OAuth + Coder-Frontend)
**Depends on: Phase 1 complete. Can run parallel with Phase 2.**

Tasks for **Coder-OAuth**:
1. Complete `/src/oauth/metadata.ts` - the /.well-known/oauth-authorization-server endpoint
2. Complete `/src/oauth/register.ts` - Dynamic Client Registration with proper validation
3. Complete `/src/oauth/authorize.ts` - Authorization endpoint that redirects to consent page
4. Complete `/src/oauth/token.ts` - Token endpoint with:
   - authorization_code grant (with PKCE validation using S256)
   - refresh_token grant (with token rotation)
5. Complete `/src/oauth/revoke.ts` - Token revocation
6. All tokens stored as SHA-256 hashes, never plaintext
7. Authorization codes: single-use, 10-minute expiry

Tasks for **Coder-Frontend** (consent page only in this phase):
1. Build `/src/app/oauth/consent/page.tsx` - The consent/authorization page that:
   - Shows "Authorize [Client Name]" with the app logo
   - Shows login form if user is not authenticated
   - Lists user's GSC properties with radio buttons for selection
   - Has "Authorize" and "Deny" buttons
   - On authorize: POSTs to the authorization endpoint, which redirects back to Claude with the code

**Phase 3 Definition of Done**: A manual browser test of the full OAuth flow works: visit /oauth/authorize with test params, log in, select property, get redirected with an authorization code, exchange code for tokens at /oauth/token.

---

### Phase 4: Google OAuth + GSC Connection (Coder-OAuth + Coder-Frontend)
**Depends on: Phase 1 complete**

Tasks for **Coder-OAuth**:
1. Build `/src/app/api/auth/google/route.ts` - Initiates Google OAuth (for platform login)
2. Build `/src/app/api/auth/google/callback/route.ts` - Handles Google callback, creates user account
3. Build `/src/app/api/gsc/connect/route.ts` - Initiates Google OAuth with GSC scopes
4. Build `/src/app/api/gsc/callback/route.ts` - Stores encrypted refresh token, fetches properties
5. Build `/src/app/api/gsc/properties/route.ts` - GET lists properties, POST selects active ones

Tasks for **Coder-Frontend**:
1. Build property selector component (checkbox list, not radio - supports multi-select)
2. Build connection status component

**Phase 4 Definition of Done**: Can sign up with Google, connect GSC, see properties listed, select multiple properties.

---

### Phase 5: Dashboard + Landing Page (Coder-Frontend)
**Depends on: Phases 2-4 complete**

Tasks:
1. Build landing page at `/src/app/(marketing)/page.tsx` with:
   - Hero section explaining the product
   - Feature list (natural language queries, works with Claude/ChatGPT/Cursor, etc.)
   - Demo/screenshot section
   - CTA button "Connect Your GSC"
2. Build dashboard at `/src/app/(dashboard)/dashboard/page.tsx` with:
   - Connection status (which properties are connected)
   - MCP endpoint URL (copyable)
   - API key display (with copy button, prefix shown)
   - Setup instructions tabs: Claude.ai, ChatGPT, Claude Desktop, Cursor
3. Build API key management at `/src/app/(dashboard)/keys/page.tsx`:
   - Create new key (show full key ONCE, then only prefix)
   - List keys with last used timestamp
   - Revoke key button
4. Use TailwindCSS + shadcn/ui throughout
5. Dark theme as primary (matching the product brand)

**Phase 5 Definition of Done**: All pages render, navigation works, dashboard shows real data from the database.

---

### Phase 6: Integration Testing + Security Review (QA + Security)
**Depends on: ALL previous phases complete**

Tasks for **QA**:
1. Test full user journey: sign up, connect GSC, get MCP endpoint, add to Claude.ai as custom connector, ask a question, get real GSC data back
2. Test each of the 13 MCP tools individually via MCP Inspector
3. Test OAuth flow edge cases: expired codes, reused codes, wrong redirect_uri, missing PKCE
4. Test token refresh: wait for access token expiry, verify automatic refresh works
5. Test error handling: invalid property, revoked Google token, rate limits
6. Write test report in `/docs/test-report.md`

Tasks for **Security**:
1. Verify all Google tokens are encrypted at rest (check database directly)
2. Verify API keys are stored as hashes only
3. Verify no secrets in code or git history
4. Verify PKCE is enforced on authorization code exchange
5. Verify rate limiting works
6. Verify CORS is configured correctly
7. Check for SQL injection vectors (should be none with Prisma, but verify)
8. Write security audit report in `/docs/security-audit.md`

---

## Step 3: Important Constraints (ALL agents must follow)

### Technical Constraints
- **TypeScript strict mode** throughout - no `any` types except where absolutely necessary (document why)
- **Prisma only** for database access - NO raw SQL anywhere
- **Build for localhost first** - all URLs default to localhost, production URLs come from env vars
- **Skip Stripe billing** - mark with `// TODO: STRIPE - implement billing check` comments
- **No em dashes** in any user-facing text (use hyphens instead)

### Port Configuration
- Next.js web app: `localhost:3000`
- MCP server: `localhost:3001`
- PostgreSQL: `localhost:5432`

### Error Handling Pattern (all agents must use this)
```typescript
// Every async function should follow this pattern:
try {
  // actual logic
} catch (error) {
  if (error instanceof AppError) {
    // known error, return user-friendly message
  }
  console.error(`[module-name] Unexpected error:`, error);
  throw new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.");
}
```

### Response Formatting for MCP Tools
```typescript
// Success response
return {
  content: [{
    type: "text",
    text: JSON.stringify({ success: true, data: formattedData }, null, 2)
  }]
};

// Error response
return {
  content: [{
    type: "text",
    text: JSON.stringify({ success: false, error: "User-friendly error message" }, null, 2)
  }],
  isError: true
};
```

### Communication Protocol
- Agents must NOT modify files outside their owned directories
- If an agent needs a change in another agent's directory, they request it through the PM
- The Prisma schema is owned by Coder-Infra but can be modified by Architect for schema changes (coordinate via PM)
- All agents must pull latest before starting work on a new task

---

## Step 4: PM Creates Initial Task Board

The Project Manager should immediately create a task list in `/docs/tasks.md` with:
- Every task from the phases above
- Assigned agent
- Status: TODO / IN_PROGRESS / DONE / BLOCKED
- Dependencies (which tasks must complete first)
- Update this file after each task completion

Start execution with Phase 1 immediately after the task board is created.
