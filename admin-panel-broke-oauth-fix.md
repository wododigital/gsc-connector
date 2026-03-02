# FIX: Recent Admin Panel Changes Broke OAuth and MCP

## Context
This is a Next.js App Router application (OMG AI GSC Connect) deployed on Railway. It connects Google Search Console and GA4 data to Claude.ai via MCP (Model Context Protocol).

**Everything was working perfectly** - OAuth sign-in, MCP tool calls from Claude.ai, all 13 GSC/GA4 tools. Then we added an admin panel with plans, subscriptions, Stripe integration, coupons, tickets, notifications, and activity logs. After deploying those changes, BOTH OAuth sign-in AND MCP connections are broken.

## Architecture (Was Working Before)
- Next.js on port 8080 (frontend, OAuth, API routes)
- Standalone MCP server on port 3001 (SSE endpoint for Claude.ai)
- Both started via: `concurrently "next start" "node dist/mcp/server.js"`
- PostgreSQL database on Railway (Prisma ORM)
- This dual-server setup WAS working. Do NOT change it unless absolutely necessary.

## Current Errors
1. Clicking "Sign in with Google" shows Railway's "Application failed to respond" page
2. Claude.ai shows "There was an error connecting to the MCP server"
3. Railway logs show both servers starting successfully - no crash on startup

## What This Means
The servers start fine but REQUESTS are failing at runtime. Something in the new code is intercepting, blocking, or crashing requests that previously worked.

---

## STEP 1: Check for New Middleware (Most Likely Cause)

This is the #1 suspect. Admin panels almost always add middleware to protect routes.

```bash
# Find ALL middleware files
find . -name "middleware.ts" -o -name "middleware.js" | grep -v node_modules | grep -v .next

# Also check for middleware in nested directories
find . -name "middleware*" | grep -v node_modules | grep -v .next | grep -v dist
```

Read every middleware file. Look for:
- Route matching patterns - does it intercept `/api/auth/*` or `/api/mcp` or ALL `/api/*` routes?
- Session/auth checks that redirect unauthenticated users
- Admin role checks

**The fix:** The middleware MUST exclude these paths:
- `/api/auth/*` (OAuth initiation and callback)
- `/api/mcp` (MCP SSE endpoint - if proxied through Next.js)
- `/auth/*` or `/signin` or whatever the sign-in page path is

Example of a properly configured middleware:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // NEVER intercept these paths
  const publicPaths = [
    '/api/auth',      // OAuth routes
    '/api/mcp',       // MCP endpoint
    '/auth',          // Sign-in page
    '/signin',        // Sign-in page (alternate)
    '/api/health',    // Health check
    '/api/webhook',   // Stripe webhooks
    '/_next',         // Next.js internals
    '/favicon.ico',
  ]
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Admin auth checks only apply to admin routes
  if (pathname.startsWith('/admin')) {
    // ... admin authentication logic ...
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only run middleware on specific paths, NOT on all paths
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**If middleware is the problem, fixing the matcher/exclusion list will immediately restore OAuth and MCP functionality.**

---

## STEP 2: Check What Changed in Git

```bash
# See all files changed in recent commits (the admin panel work)
git log --oneline -10

# Find the last known working commit
# Look for commits BEFORE the admin panel work
git log --oneline -20

# See ALL files that changed between working state and now
git diff <last-working-commit> HEAD --stat

# Specifically check for changes to critical files
git diff <last-working-commit> HEAD -- middleware.ts middleware.js
git diff <last-working-commit> HEAD -- next.config.*
git diff <last-working-commit> HEAD -- package.json
git diff <last-working-commit> HEAD -- prisma/schema.prisma
git diff <last-working-commit> HEAD -- tsconfig.json
```

Focus on:
- **New files**: especially middleware.ts, any new files under /api/
- **Modified files**: package.json (new deps, changed scripts), next.config (new redirects/rewrites), prisma schema
- **Deleted files**: did anything critical get removed?

---

## STEP 3: Check Prisma Schema Changes

```bash
# See the current schema
cat prisma/schema.prisma

# Check migration history
ls -la prisma/migrations/

# See the most recent migration
ls prisma/migrations/ | tail -5
cat prisma/migrations/$(ls prisma/migrations/ | tail -1)/migration.sql
```

Look for:
- Did any existing tables (users, tokens, accounts) get altered?
- Were columns renamed or dropped?
- Were foreign key constraints added that break existing queries?
- Is the migration applied? (Logs say "No pending migrations to apply" so migrations are fine, but the SQL might have broken existing data)

**Check if existing token/user data was corrupted:**
```bash
# Connect to the database and verify
npx prisma studio
# OR
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM tokens;"
```

---

## STEP 4: Check for Route Conflicts

```bash
# List ALL API routes
find . -path "*/api/*" -name "route.ts" -o -path "*/api/*" -name "route.js" | grep -v node_modules | grep -v .next | sort

# Check if new routes shadow existing OAuth routes
find . -path "*/api/auth*" -name "*.ts" | grep -v node_modules | grep -v .next
```

If the admin panel added new routes under `/api/auth/` (like `/api/auth/admin`), they might be conflicting with the existing OAuth routes through Next.js route matching.

---

## STEP 5: Check next.config Changes

```bash
cat next.config.js 2>/dev/null || cat next.config.mjs 2>/dev/null || cat next.config.ts 2>/dev/null
```

Look for new:
- `redirects()` - might be redirecting auth routes
- `rewrites()` - might be rewriting paths
- `headers()` - might be adding CORS or security headers that break SSE/OAuth
- `middleware` config changes

---

## STEP 6: Check package.json Changes

```bash
cat package.json
```

Verify:
- The `start` script is still: `concurrently "next start" "node dist/mcp/server.js"`
- The `build` script still includes Prisma generate and MCP server compilation
- No new dependencies that could cause runtime conflicts
- Node engine version has not been restricted

---

## STEP 7: Quick Revert Test (If Still Stuck)

If you cannot find the specific breaking change after Steps 1-6, do a targeted revert:

```bash
# Find the last working commit hash
git log --oneline -20

# Create a test branch from the working commit
git checkout -b test-working <last-working-commit-hash>

# Deploy this branch to verify it actually works
git push origin test-working
```

If the old commit works on Railway, then do a file-by-file comparison:
```bash
git diff <working-commit> HEAD -- middleware.ts
git diff <working-commit> HEAD -- next.config.*
git diff <working-commit> HEAD -- src/app/api/auth/
git diff <working-commit> HEAD -- app/api/auth/
```

Then cherry-pick the admin panel changes back one file at a time, testing after each, to find the exact file that breaks it.

---

## STEP 8: After Finding and Fixing the Issue

1. `npm run build` - must succeed
2. `git add -A && git commit -m "fix: exclude auth and MCP routes from admin middleware"`
3. `git push origin main`
4. Watch Railway logs
5. Test sign-in flow in browser
6. Test MCP from Claude.ai (try list_my_properties)
7. Verify admin panel still works after the fix

---

## Most Likely Fix (90% Confidence)

The fix is almost certainly ONE of these:

**A) Middleware exclusion** (most likely): Add OAuth and MCP paths to the middleware's public/excluded paths list. This is a 2-3 line change.

**B) next.config redirect/rewrite** (second most likely): Remove or fix a new redirect rule that is catching auth routes.

**C) Prisma schema breaking change** (less likely since migrations applied clean): Fix a column rename or table alteration that broke existing queries.

## Rules
- Do NOT restructure the dual-server architecture. It was working before.
- Do NOT rewrite OAuth or MCP code unless it was specifically changed in the admin panel commits
- The goal is to find what the admin panel changes broke and fix ONLY that
- Do not use em dashes in any code or text
- Keep changes minimal - ideally a one-file fix
