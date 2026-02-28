# GSC Connect - Task Board

Last updated: 2026-02-28

## Legend
- TODO - Not started
- IN_PROGRESS - Being worked on
- DONE - Completed and verified
- BLOCKED - Waiting on dependency

---

## Phase 1: Foundation
**Owner: Architect + Coder-Infra | Status: IN_PROGRESS**

| # | Task | Owner | Status | Depends On |
|---|------|-------|--------|------------|
| 1.1 | TypeScript interfaces (src/types/index.ts) | Architect | DONE | - |
| 1.2 | Config module (src/config/index.ts) | Architect | DONE | - |
| 1.3 | Prisma migration (init) | Coder-Infra | DONE | - |
| 1.4 | .env.example with all vars | Coder-Infra | DONE | - |
| 1.5 | package.json - Next.js + MCP dual setup | Coder-Infra | DONE | - |
| 1.6 | tsconfig.json updated for Next.js | Architect | DONE | - |
| 1.7 | tailwind.config.ts | Coder-Frontend | DONE | - |
| 1.8 | Prisma client singleton (src/lib/db.ts) | Architect | DONE | 1.3 |
| 1.9 | Auth/JWT utilities (src/lib/auth.ts) | Architect | DONE | 1.2 |
| 1.10 | scripts/setup.sh | Coder-Infra | TODO | - |
| 1.11 | ecosystem.config.js (local dev paths) | Coder-Infra | TODO | - |

---

## Phase 2: MCP Server
**Owner: Coder-MCP | Status: TODO | Depends: Phase 1 complete**

| # | Task | Owner | Status | Depends On |
|---|------|-------|--------|------------|
| 2.1 | src/mcp/server.ts - MCP server init + transport | Coder-MCP | TODO | Phase 1 |
| 2.2 | src/mcp/middleware/auth.ts - bearer token auth | Coder-MCP | TODO | Phase 1 |
| 2.3 | src/mcp/helpers/gsc-client.ts - auto token refresh | Coder-MCP | TODO | Phase 1 |
| 2.4 | src/mcp/tools/search-analytics.ts (get_search_analytics) | Coder-MCP | TODO | 2.1-2.3 |
| 2.5 | src/mcp/tools/top-keywords.ts (get_top_keywords) | Coder-MCP | TODO | 2.1-2.3 |
| 2.6 | src/mcp/tools/top-pages.ts (get_top_pages) | Coder-MCP | TODO | 2.1-2.3 |
| 2.7 | src/mcp/tools/keyword-for-page.ts (get_keyword_for_page) | Coder-MCP | TODO | 2.1-2.3 |
| 2.8 | src/mcp/tools/url-inspection.ts (inspect_url) | Coder-MCP | TODO | 2.1-2.3 |
| 2.9 | src/mcp/tools/sitemaps.ts (list/get/submit/delete) | Coder-MCP | TODO | 2.1-2.3 |
| 2.10 | src/mcp/tools/sites.ts (list/add/delete) | Coder-MCP | TODO | 2.1-2.3 |
| 2.11 | src/mcp/tools/mobile-friendly.ts | Coder-MCP | TODO | 2.1-2.3 |
| 2.12 | MCP Inspector verification | QA | TODO | 2.4-2.11 |

---

## Phase 3: OAuth2 Provider
**Owner: Coder-OAuth | Status: TODO | Depends: Phase 1 complete (parallel with Phase 2)**

| # | Task | Owner | Status | Depends On |
|---|------|-------|--------|------------|
| 3.1 | src/app/api/oauth/metadata/route.ts (well-known) | Coder-OAuth | TODO | Phase 1 |
| 3.2 | src/app/api/oauth/register/route.ts (DCR) | Coder-OAuth | TODO | Phase 1 |
| 3.3 | src/app/api/oauth/authorize/route.ts | Coder-OAuth | TODO | Phase 1 |
| 3.4 | src/app/api/oauth/token/route.ts (PKCE) | Coder-OAuth | TODO | Phase 1 |
| 3.5 | src/app/api/oauth/revoke/route.ts | Coder-OAuth | TODO | Phase 1 |
| 3.6 | src/app/oauth/consent/page.tsx | Coder-Frontend | TODO | 3.1-3.5 |
| 3.7 | Manual browser OAuth flow test | QA | TODO | 3.6 |

---

## Phase 4: Google OAuth + GSC Connection
**Owner: Coder-OAuth | Status: TODO | Depends: Phase 1 complete (parallel with 2+3)**

| # | Task | Owner | Status | Depends On |
|---|------|-------|--------|------------|
| 4.1 | src/app/api/auth/google/route.ts | Coder-OAuth | TODO | Phase 1 |
| 4.2 | src/app/api/auth/google/callback/route.ts | Coder-OAuth | TODO | Phase 1 |
| 4.3 | src/app/api/gsc/connect/route.ts | Coder-OAuth | TODO | 4.2 |
| 4.4 | src/app/api/gsc/callback/route.ts | Coder-OAuth | TODO | 4.3 |
| 4.5 | src/app/api/gsc/properties/route.ts | Coder-OAuth | TODO | 4.4 |
| 4.6 | src/app/api/keys/route.ts (API key management) | Coder-OAuth | TODO | Phase 1 |
| 4.7 | Property selector component | Coder-Frontend | TODO | 4.5 |
| 4.8 | Connection status component | Coder-Frontend | TODO | 4.5 |

---

## Phase 5: Dashboard + Frontend
**Owner: Coder-Frontend | Status: TODO | Depends: Phases 2-4 complete**

| # | Task | Owner | Status | Depends On |
|---|------|-------|--------|------------|
| 5.1 | src/app/layout.tsx (root layout) | Coder-Frontend | TODO | Phase 1 |
| 5.2 | src/app/(marketing)/page.tsx (landing page) | Coder-Frontend | TODO | 5.1 |
| 5.3 | src/app/(marketing)/layout.tsx | Coder-Frontend | TODO | 5.1 |
| 5.4 | src/app/(dashboard)/layout.tsx (auth check) | Coder-Frontend | TODO | Phase 4 |
| 5.5 | src/app/(dashboard)/dashboard/page.tsx | Coder-Frontend | TODO | 5.4, Phase 4 |
| 5.6 | src/app/(dashboard)/keys/page.tsx | Coder-Frontend | TODO | 4.6 |
| 5.7 | src/app/auth/login/page.tsx | Coder-Frontend | TODO | Phase 4 |
| 5.8 | src/components/ui/ (shadcn components) | Coder-Frontend | TODO | Phase 1 |

---

## Phase 6: Testing + Security
**Owner: QA + Security | Status: TODO | Depends: All phases complete**

| # | Task | Owner | Status | Depends On |
|---|------|-------|--------|------------|
| 6.1 | Test full user journey | QA | TODO | Phase 5 |
| 6.2 | Test all 13 MCP tools via Inspector | QA | TODO | Phase 2 |
| 6.3 | Test OAuth edge cases | QA | TODO | Phase 3 |
| 6.4 | Test token refresh flow | QA | TODO | Phases 2+4 |
| 6.5 | Security audit - token encryption | Security | TODO | Phase 4 |
| 6.6 | Security audit - PKCE enforcement | Security | TODO | Phase 3 |
| 6.7 | Security audit - no secrets in code | Security | TODO | All |
| 6.8 | Write test report (docs/test-report.md) | QA | TODO | 6.1-6.4 |
| 6.9 | Write security audit (docs/security-audit.md) | Security | TODO | 6.5-6.7 |

---

## Current Sprint Blockers
None at this time.

## Notes
- Skip Stripe billing - mark with // TODO: STRIPE
- Skip transactional email - mark with // TODO: EMAIL
- No em dashes in user-facing text
- All local dev: localhost:3000 (web), localhost:3001 (MCP), localhost:5432 (PostgreSQL)
