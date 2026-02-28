# GSC Connect - Project Instructions for Claude Agents

## CURRENT SPRINT CONSTRAINTS (READ THIS FIRST)

- **LOCAL BUILD ONLY:** Everything runs on localhost. No VPS deployment this sprint.
- **Ports:** Next.js on 3000, MCP server on 3001, PostgreSQL on 5432
- **SKIP STRIPE:** Do not implement billing. Mark all billing logic with `// TODO: STRIPE`
- **SKIP EMAIL:** Do not implement transactional emails. Mark with `// TODO: EMAIL`
- **NO EM DASHES:** Never use em dashes (-) in any user-facing text. Use hyphens instead.
- **Node.js 22 LTS** required (not 25.x which is experimental)
- **Read PRD.md** for the full product spec (not the .docx)
- **Read swarm-prompt.md** for build phases and agent task assignments

---

## Product Overview

GSC Connect is a SaaS product that bridges Google Search Console to AI assistants (Claude, ChatGPT, Cursor) via the Model Context Protocol (MCP). Users authenticate with Google, select their GSC properties, and receive a remote MCP endpoint they can plug into any MCP-compatible AI tool.

**Prepared by:** WODO Digital
**PRD Version:** 1.0
**Classification:** Internal / For AI Coding Agents

---

## Architecture at a Glance

```
User -> GSC Connect Web App (Next.js) -> MCP Server (Node.js) -> Google Search Console API
          | OAuth2 Provider (for Claude/ChatGPT)
          | PostgreSQL (Prisma ORM)
```

**Five Components:**
1. **Web App (Frontend):** Next.js 14+ App Router, TailwindCSS, shadcn/ui
2. **API Backend:** Next.js API Routes for auth, GSC connection
3. **MCP Server:** Node.js with @modelcontextprotocol/sdk - exposes 13 tools
4. **OAuth2 Provider:** Custom implementation (Dynamic Client Registration + PKCE) so Claude.ai can authenticate users
5. **Database:** PostgreSQL via Prisma ORM

---

## Repository Structure

```
gsc-connect/
  src/
    app/                     # Next.js App Router
      (marketing)/           # Landing page, pricing
      (dashboard)/           # Auth-protected dashboard
      api/
        auth/                # Platform auth endpoints
        gsc/                 # GSC connection endpoints
        keys/                # API key management
        billing/             # TODO: STRIPE - placeholder only
      oauth/
        authorize/           # Consent page UI
    lib/
      db.ts                  # Prisma client
      encryption.ts          # AES-256-GCM encrypt/decrypt
      google-api.ts          # Google OAuth + GSC API helpers
      auth.ts                # Session/JWT management
    mcp/
      server.ts              # MCP server setup + transport
      tools/                 # 13 tool implementations
      middleware/             # Auth middleware for MCP requests
      helpers/               # GSC client wrapper with auto token refresh
    oauth/
      metadata.ts            # /.well-known/oauth-authorization-server
      register.ts            # Dynamic Client Registration
      authorize.ts           # Authorization endpoint
      token.ts               # Token endpoint
      revoke.ts              # Token revocation
    types/
      index.ts               # Shared TypeScript interfaces
    config/
      index.ts               # Env var loader with validation
    components/              # React components
  prisma/
    schema.prisma            # Database schema (8 tables)
  nginx/                     # Nginx config (for production later)
  ecosystem.config.js        # PM2 config
  .env.example               # Template for env vars
```

---

## The 13 MCP Tools (all in src/mcp/tools/)

| Tool | GSC API | Status |
|------|---------|--------|
| get_search_analytics | searchAnalytics.query | SCAFFOLD |
| get_top_keywords | searchAnalytics.query (query dim) | SCAFFOLD |
| get_top_pages | searchAnalytics.query (page dim) | SCAFFOLD |
| get_keyword_for_page | searchAnalytics.query (filtered) | SCAFFOLD |
| inspect_url | urlInspection.index.inspect | SCAFFOLD |
| list_sitemaps | sitemaps.list | SCAFFOLD |
| get_sitemap | sitemaps.get | SCAFFOLD |
| submit_sitemap | sitemaps.submit | SCAFFOLD |
| delete_sitemap | sitemaps.delete | SCAFFOLD |
| list_sites | sites.list | SCAFFOLD |
| add_site | sites.add | SCAFFOLD |
| delete_site | sites.delete | SCAFFOLD |
| run_mobile_friendly_test | mobileFriendlyTest.run | SCAFFOLD |

---

## Authentication System (CRITICAL - Read This First)

There are TWO separate OAuth systems. This is the most complex part.

**OAuth Flow A: Google OAuth (GSC access)**
- Your app is an OAuth CLIENT requesting Google for GSC data
- Scopes: `webmasters.readonly`, `openid email profile`
- Stores: refresh_token (AES-256 encrypted), access_token (rotated hourly)
- Flow: User -> Google consent -> callback -> store tokens -> done

**OAuth Flow B: Your App as OAuth PROVIDER (for Claude/ChatGPT)**
- YOUR app acts as an OAuth authorization server
- Claude registers via Dynamic Client Registration (RFC 7591)
- Required endpoints: `/.well-known/oauth-authorization-server`, `/oauth/register`, `/oauth/authorize`, `/oauth/token`, `/oauth/revoke`
- MUST support PKCE (code_challenge_method: S256)
- MUST support Dynamic Client Registration (Claude requirement)

---

## Database (Prisma Schema - 8 Tables)

- `users` - platform accounts
- `google_credentials` - encrypted Google tokens per user
- `gsc_properties` - GSC sites connected to each user
- `api_keys` - for Claude Desktop/Cursor auth (stored as SHA-256 hashes)
- `oauth_clients` - registered via DCR (Claude, ChatGPT register here)
- `oauth_tokens` - tokens issued to Claude/ChatGPT for MCP access
- `oauth_authorization_codes` - short-lived, single-use, 10-minute expiry
- `usage_logs` - track tool calls per user for tier enforcement

---

## Security Requirements (Non-Negotiable)

- Google refresh tokens: AES-256-GCM encrypted at rest (key in env var)
- API keys: SHA-256 hash only, plaintext shown ONCE at creation
- OAuth auth codes: single-use, 10-minute expiry
- All MCP requests: validate OAuth bearer token on EVERY request
- PKCE: verify code_verifier against stored code_challenge using SHA-256
- Token rotation: issue new refresh tokens on use, invalidate old ones
- Rate limiting: 100 req/min MCP (per user), 10 req/min auth endpoints

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ App Router |
| Styling | TailwindCSS + shadcn/ui |
| MCP Server | @modelcontextprotocol/sdk (TypeScript) |
| Database | PostgreSQL 15+ |
| ORM | Prisma |
| Auth JWTs | jose library |
| Encryption | Node.js crypto (AES-256-GCM) |
| Process Manager | PM2 |
| Reverse Proxy | Nginx (production only, skip for local) |
| LLM | Anthropic API (for AI insights feature - Phase 5) |

---

## Environment Variables (Local Development)

```env
NODE_ENV=development
APP_URL=http://localhost:3000
APP_SECRET=<64-char-hex>
ENCRYPTION_KEY=<32-byte-hex>
DATABASE_URL=postgresql://gscconnect:gscconnect@localhost:5432/gscconnect
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gsc/callback
```

Generate secrets locally with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Development Phases (This Sprint)

| Phase | Focus | Depends On |
|-------|-------|------------|
| 1 | Local PostgreSQL + Prisma migrations + TypeScript interfaces + project config | Nothing |
| 2 | MCP server - implement all 13 tools with MCP Inspector testing | Phase 1 |
| 3 | OAuth2 Provider - DCR, PKCE, consent page, token flow | Phase 1 |
| 4 | Google OAuth - GSC connection, property selection, token storage | Phase 1 |
| 5 | Dashboard, landing page, API key management, setup instructions | Phases 2-4 |
| 6 | Integration testing + security review | All above |

**NOT this sprint:** Stripe billing, email, VPS deployment, Nginx, AI insights

---

## Key Differentiators vs Ekamoira (Competitor)

- **Multi-property:** Select multiple GSC properties (Ekamoira = 1 at a time)
- **AI insights:** Dashboard shows AI-generated SEO summaries via Anthropic API (Phase 5, future sprint)
- **Agency tier:** Manage client properties under one account
- **Generous free tier:** 1 property, 100 queries/day (Ekamoira: 30-day trial then paid)

---

## Coding Standards

- TypeScript strict mode throughout - no `any` types unless documented with a comment explaining why
- All async functions wrapped in try/catch with proper error types
- Never log or expose tokens/secrets in output
- Always validate tool parameters against JSON schemas before API calls
- Use Prisma for all DB queries - no raw SQL, ever
- Test each MCP tool with MCP Inspector before moving to next

### Error Handling Pattern (all agents must use)

```typescript
try {
  // actual logic
} catch (error) {
  if (error instanceof AppError) {
    // known error - return user-friendly message
  }
  console.error(`[module-name] Unexpected error:`, error);
  throw new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.");
}
```

### MCP Tool Response Format

```typescript
// Success
return {
  content: [{
    type: "text",
    text: JSON.stringify({ success: true, data: formattedData }, null, 2)
  }]
};

// Error
return {
  content: [{
    type: "text",
    text: JSON.stringify({ success: false, error: "User-friendly message" }, null, 2)
  }],
  isError: true
};
```

---

## Agent Roles for Ruflo Swarm

See **swarm-prompt.md** for full agent assignments, task breakdown, and build phases.

| Agent | Owns |
|-------|------|
| PM | /docs/, task tracking |
| Architect | /src/types/, /src/config/, architecture decisions |
| Coder-MCP | /src/mcp/ (server, tools, middleware, helpers) |
| Coder-OAuth | /src/oauth/, consent page logic |
| Coder-Frontend | /src/app/, /src/components/, /src/styles/ |
| Coder-Infra | /prisma/, /scripts/, .env.example, docker-compose.yml |
| QA | /tests/, test scripts, test reports |
| Security | Security audit reports |

**File Ownership Rule:** Agents must NOT modify files outside their owned directories. Cross-directory changes go through the PM.
