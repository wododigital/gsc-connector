# URGENT: MCP Server Crash + OAuth Deadlock Fix

## What Is Broken (Confirmed)
1. The MCP server at /api/mcp IS deployed on Railway and sometimes accepts connections, but ALL tool executions fail with runtime errors
2. The OAuth sign-in flow shows "Something went wrong during sign-in" after Google consent screen redirect
3. Users are deadlocked: tools fail (bad/expired Google tokens) and re-authentication is broken (OAuth callback fails)

## Server URL
https://gsc-connector-production.up.railway.app/api/mcp

## Root Cause Hypothesis
The MCP tools try to use stored Google OAuth tokens to call GSC/GA4 APIs. Those tokens have expired or been revoked. When a user tries to re-authenticate via "Sign in with Google", the OAuth callback route fails (likely redirect_uri mismatch or token exchange error), so fresh tokens never get stored. Result: permanent failure loop.

---

## STEP 1: Check Railway Logs NOW (30 seconds)

Before touching any code, check what Railway is actually logging:

```bash
# If you have Railway CLI installed
railway logs --latest

# Otherwise, open Railway dashboard > your project > Deployments > latest > View Logs
```

Look for:
- Any crash/restart loops (Railway auto-restarts crashed processes)
- Specific error messages on tool execution
- OAuth callback errors
- Database connection errors
- "unhandled rejection" or "uncaught exception" messages

**Write down the exact error messages before proceeding.**

---

## STEP 2: Verify the Build Works

```bash
npm install
npm run build
```

If build fails, fix build errors first. Nothing else matters if it does not build.

---

## STEP 3: Check Environment Variables

List every environment variable the app needs and verify each one exists:

```bash
# Find all env var references in the codebase
grep -roh 'process\.env\.\w\+' src/ app/ lib/ pages/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | sort -u
```

Then verify against what Railway has set. Critical ones to check:

| Variable | What to verify |
|----------|---------------|
| DATABASE_URL | Valid PostgreSQL connection string, DB is accessible |
| GOOGLE_CLIENT_ID | Matches Google Cloud Console |
| GOOGLE_CLIENT_SECRET | Matches Google Cloud Console (not the ID, the secret) |
| APP_URL or NEXT_PUBLIC_APP_URL | Exactly https://gsc-connector-production.up.railway.app (no trailing slash) |
| Any REDIRECT_URI variable | Must match Google Cloud Console authorized redirect URIs exactly |

**NEXT_PUBLIC_ trap**: Any variable starting with NEXT_PUBLIC_ is baked into the JavaScript bundle at BUILD TIME. If you changed the value in Railway after the last deploy, the running code still has the old value. You must redeploy after changing NEXT_PUBLIC_ variables.

---

## STEP 4: Fix the OAuth Callback (This Unblocks Everything)

### 4A. Find the callback route
```bash
find . -path "*/api/auth*" -o -path "*/callback*" | grep -v node_modules | grep -v .next
```

### 4B. Add error visibility
Find the try-catch in the callback handler. Replace the generic error with detailed logging:

```typescript
catch (error: any) {
  console.error('[OAUTH CALLBACK ERROR]', {
    message: error?.message,
    response_data: error?.response?.data,
    status: error?.response?.status,
    stack: error?.stack?.split('\n').slice(0, 5)
  })
  // Keep the existing redirect to error page
}
```

### 4C. Fix redirect_uri consistency
This is almost certainly the issue. Find EVERY place redirect_uri is constructed:

```bash
grep -rn "redirect" --include="*.ts" --include="*.tsx" --include="*.js" src/ app/ lib/ pages/ 2>/dev/null | grep -vi node_modules | grep -vi .next | grep -i "uri\|url\|callback\|oauth\|google"
```

Create ONE source of truth:

```typescript
// lib/auth-config.ts (or wherever makes sense in your project)
export function getGoogleRedirectUri(): string {
  // Use server-side env var, NOT NEXT_PUBLIC_
  const base = process.env.APP_URL 
    || process.env.NEXTAUTH_URL 
    || process.env.NEXT_PUBLIC_APP_URL
  if (!base) throw new Error('No APP_URL configured')
  return `${base.replace(/\/$/, '')}/api/auth/callback/google`
}
```

Then use this function in BOTH:
1. The route that builds the Google authorization URL (where user gets sent to Google)
2. The callback route that exchanges the auth code for tokens

### 4D. Verify Google Cloud Console
Go to https://console.cloud.google.com > APIs & Services > Credentials > your OAuth client

Check "Authorized redirect URIs" contains EXACTLY:
```
https://gsc-connector-production.up.railway.app/api/auth/callback/google
```
(or whatever your actual callback path is)

No trailing slash difference. No http vs https difference. No www difference.

Also check "Authorized JavaScript origins" contains:
```
https://gsc-connector-production.up.railway.app
```

---

## STEP 5: Fix MCP Tool Execution Errors

### 5A. Find the MCP route handler
```bash
find . -path "*/api/mcp*" -type f | grep -v node_modules | grep -v .next
```

### 5B. Check how tools retrieve Google tokens
Each tool needs valid Google OAuth tokens to call GSC/GA4 APIs. Find the token retrieval logic:

```bash
grep -rn "access_token\|refresh_token\|getToken\|getAuth\|google.*auth\|oauth.*token" --include="*.ts" --include="*.tsx" src/ app/ lib/ 2>/dev/null | grep -v node_modules
```

Common failure points:
- Tokens are fetched from the database but the record does not exist (user never successfully authenticated)
- Access token expired and refresh token logic fails silently
- Refresh token was revoked by Google (user removed app permissions in Google Account settings)

### 5C. Add token refresh error handling
Find the token refresh logic and make sure it:
1. Catches refresh failures explicitly
2. Returns a clear error like "Authentication expired, please re-authenticate" instead of crashing
3. Does NOT crash the entire MCP server process when one user's tokens are bad

```typescript
async function getValidToken(userId: string) {
  const stored = await getStoredToken(userId)
  if (!stored) {
    throw new Error('No tokens found. User must authenticate first.')
  }
  
  // Check if access token is expired
  if (stored.expires_at && new Date(stored.expires_at) < new Date()) {
    try {
      const refreshed = await refreshGoogleToken(stored.refresh_token)
      await saveToken(userId, refreshed)
      return refreshed.access_token
    } catch (refreshError) {
      console.error('[TOKEN REFRESH FAILED]', refreshError)
      // Delete the bad tokens so user can re-auth cleanly
      await deleteToken(userId)
      throw new Error('Token refresh failed. User must re-authenticate.')
    }
  }
  
  return stored.access_token
}
```

### 5D. Wrap every tool handler in error protection
No single tool failure should crash the MCP server:

```typescript
// In each tool handler or a wrapper function
try {
  const token = await getValidToken(userId)
  const result = await executeGSCQuery(token, params)
  return result
} catch (error) {
  // Return error as MCP response, do NOT throw/crash
  return {
    error: true,
    message: error instanceof Error ? error.message : 'Unknown error'
  }
}
```

---

## STEP 6: Add a Health Check

Create /api/health route:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const checks: Record<string, string> = {}
  
  // Check DB
  try {
    // Run a simple query like SELECT 1
    checks.database = 'ok'
  } catch (e) {
    checks.database = `failed: ${(e as Error).message}`
  }
  
  // Check env vars
  const required = ['DATABASE_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
  const missing = required.filter(k => !process.env[k])
  checks.env_vars = missing.length === 0 ? 'ok' : `missing: ${missing.join(', ')}`
  
  // Check Google OAuth config
  const redirectUri = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
  checks.app_url = redirectUri ? `ok (${redirectUri})` : 'NOT SET'
  
  const allOk = Object.values(checks).every(v => v === 'ok' || v.startsWith('ok'))
  
  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  )
}
```

---

## STEP 7: Deploy and Test

### 7A. Commit and push
```bash
git add -A
git commit -m "fix: OAuth callback error handling and MCP tool error protection"
git push origin main
```

### 7B. After Railway deploys, test in this order:
1. Hit health check: `curl https://gsc-connector-production.up.railway.app/api/health`
2. If health check fails, read Railway logs and fix whatever is reported
3. Try the sign-in flow in browser
4. After successful sign-in, go to Claude.ai and test a simple tool like list_my_properties
5. Test at least 2 more tools (get_top_keywords, ga_list_properties)

### 7C. If OAuth still fails after code fix:
- Check Railway logs for the detailed error you added in Step 4B
- The log will tell you exactly what Google rejected (wrong redirect_uri, bad client_secret, expired code, etc.)
- Fix based on the specific error, redeploy, test again

---

## Rules
- Do not break existing MCP tool definitions or response formats
- Do not change database schema unless a migration is clearly missing
- Do not use em dashes anywhere in code or user-facing text
- Fix the OAuth callback FIRST since that unblocks token refresh
- Every change must build successfully before committing
- Keep Railway logs open in a separate window while testing
