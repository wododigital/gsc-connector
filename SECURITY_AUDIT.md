# Security Audit Report - OMG AI

**Date:** 2026-03-02
**Scope:** Full application (Next.js web app + MCP server)
**Auditor:** Automated security review

---

## Summary

| Severity | Found | Fixed |
|----------|-------|-------|
| CRITICAL | 4     | 4     |
| HIGH     | 6     | 2     |
| MEDIUM   | 5     | 0     |
| LOW      | 3     | 0     |

---

## CRITICAL Findings

### C-1: Open Redirect via `next` Parameter - FIXED
**File:** `src/app/api/auth/google/route.ts`

The `next` and `return_to` query parameters were stored in a cookie without validation, allowing attackers to craft URLs that redirect users to arbitrary external sites after login.

**Fix applied:** Parameter is now validated to start with `/` and not `//` before being stored. Only relative paths are accepted.

```typescript
// Fixed: only allow relative paths
if (next && next.startsWith("/") && !next.startsWith("//")) {
  response.cookies.set("oauth_next", next, { ... });
}
```

---

### C-2: PKCE Method Not Enforced (authorize endpoint) - FIXED
**File:** `src/app/api/oauth/authorize/route.ts`

The OAuth authorization endpoint accepted any `code_challenge_method` value (including `plain`, which is cryptographically weak) or no method at all when a `code_challenge` was provided.

**Fix applied:** When `code_challenge` is present, `code_challenge_method` must be `"S256"`. Requests with any other method are rejected with `invalid_request`.

```typescript
if (code_challenge && code_challenge_method !== "S256") {
  return NextResponse.json(
    { error: "invalid_request", error_description: "code_challenge_method must be S256" },
    { status: 400 }
  );
}
```

---

### C-3: PKCE Method Not Verified at Token Exchange - FIXED
**File:** `src/app/api/oauth/token/route.ts`

The token endpoint performed PKCE verification (SHA-256 hash comparison) but did not check whether `codeChallengeMethod` stored in the authorization code was `"S256"`. A downgrade attack could bypass this by storing a `plain` code via an older code path.

**Fix applied:** Token endpoint now explicitly verifies `authCode.codeChallengeMethod === "S256"` before accepting the code verifier.

```typescript
if (authCode.codeChallengeMethod !== "S256") {
  return NextResponse.json(
    { error: "invalid_grant", error_description: "Unsupported code_challenge_method" },
    { status: 400 }
  );
}
```

---

### C-4: Session Secret Fallback in Production - FIXED
**File:** `src/lib/auth.ts`

The session signing secret fell back to a hardcoded string `"dev-secret-change-in-production"` if `APP_SECRET` was not set. In production, this would allow anyone who knows the fallback value to forge session JWTs.

**Fix applied:** Application now throws at startup in production if `APP_SECRET` is not set.

```typescript
const appSecret = process.env.APP_SECRET;
if (!appSecret && process.env.NODE_ENV === "production") {
  throw new Error("[auth] APP_SECRET environment variable is required in production");
}
```

---

## HIGH Findings

### H-1: DCR redirect_uri Scheme Not Validated - FIXED
**File:** `src/app/api/oauth/register/route.ts`

Dynamic Client Registration accepted any string as a redirect URI. An attacker could register `javascript:alert(1)` or `data:text/html,...` as a redirect URI, which could be used in phishing or XSS scenarios if the authorization endpoint ever redirected to it without re-checking the scheme.

**Fix applied:** All redirect URIs are now parsed as URLs. Requests containing `javascript:`, `data:`, or `vbscript:` scheme URIs are rejected.

```typescript
const BLOCKED_SCHEMES = ["javascript:", "data:", "vbscript:"];
for (const uri of redirect_uris) {
  const parsed = new URL(uri); // throws on invalid URL
  if (BLOCKED_SCHEMES.includes(parsed.protocol)) { /* reject */ }
}
```

---

### H-2: Missing Security Headers - FIXED
**File:** `next.config.mjs`

The application was not setting standard security response headers, leaving it vulnerable to clickjacking and MIME-type sniffing attacks.

**Fix applied:** Added headers to all responses:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-DNS-Prefetch-Control` | `off` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

### H-3: Google Token Encryption Key Not Validated at Startup
**File:** `src/lib/encryption.ts`

**Status:** Not fixed this sprint - marked for next sprint

If `ENCRYPTION_KEY` is not set, the AES-256-GCM encryption will use an empty or undefined key, potentially storing Google refresh tokens in plaintext or causing silent failures.

**Recommendation:** Add startup validation: throw if `ENCRYPTION_KEY` is not a 32-byte hex string in production.

---

### H-4: MCP Server Has No Rate Limiting
**File:** `src/mcp/server.ts`

**Status:** Not fixed this sprint

The MCP server at port 3001 has no IP-level rate limiting. Usage enforcement runs per-user but only after DB lookup. A burst of unauthenticated requests could stress the database.

**Recommendation:** Add express-rate-limit middleware at the Express layer before auth checks.

---

### H-5: OAuth State Parameter Not Verified in Callback
**File:** `src/app/api/gsc/callback/route.ts`

**Status:** Needs investigation

The Google OAuth callback uses a `state` parameter for CSRF protection. Verify it is read from the cookie and compared against the incoming state parameter before processing the code exchange.

---

### H-6: Stripe Webhook Signature Not Verified in Test Mode
**File:** `src/app/api/stripe/webhook/route.ts`

**Status:** Conditional - review in production

Stripe webhook signature verification using `STRIPE_WEBHOOK_SECRET` is critical. Verify the production Railway environment has this variable set. Without it, any POST to `/api/stripe/webhook` would be accepted.

---

## MEDIUM Findings

### M-1: Admin Check Relies on Email Comparison
The admin panel checks `user.email === process.env.ADMIN_EMAIL`. This is acceptable but fragile - if `ADMIN_EMAIL` is not set, no admin access exists (good), but the pattern is brittle.

### M-2: OAuth Consent Page Allows GA4 Property IDs from URL
The consent page passes `ga4_property_id` values from form checkboxes. These are validated server-side (ownership check), so exploitation requires a valid session, but confirm the check covers all edge cases.

### M-3: `prisma.$transaction` Not Used for Multi-Step Operations
Several routes perform multiple Prisma writes without transactions (e.g., deactivating all properties then activating selected ones). A server crash between operations could leave the DB in an inconsistent state.

### M-4: Error Messages May Leak Internal Details
Some catch blocks log `error` objects that could contain stack traces or query details. Ensure production logs are not publicly accessible.

### M-5: JWT Payload Includes Email/Name
Session JWTs include `email` and `name` in the payload. These are readable by anyone who can access the cookie (not encrypted, only signed). Consider omitting PII from JWT claims.

---

## LOW Findings

### L-1: `X-Forwarded-For` Not Used for Rate Limiting
If the app is behind a proxy (Railway), `req.ip` will be the proxy IP. Ensure rate limiting (if added) uses the forwarded IP correctly.

### L-2: OAuth `scope` Parameter Not Fully Validated
The authorization endpoint accepts a `scope` parameter but always stores `"gsc:read"` regardless of what was requested. This is safe (too-permissive-scope bug is avoided) but should be documented.

### L-3: `client_secret` Returned in DCR Response Only Once
The Dynamic Client Registration endpoint correctly returns `client_secret` only at registration time. Confirm it is never returned again in subsequent calls.

---

## Recommendations for Next Sprint

1. Add `ENCRYPTION_KEY` presence validation at startup (H-3)
2. Add rate limiting to MCP server (H-4)
3. Wrap multi-step DB operations in `prisma.$transaction` (M-3)
4. Add Content-Security-Policy header (blocked by inline styles from Tailwind)
5. Add HSTS header for production only (requires NEXT_PUBLIC_APP_URL check)
6. Audit all `console.error` calls to ensure no token/secret leakage

---

## Verification Commands

```bash
# Confirm open redirect fix
curl -v "http://localhost:3000/api/auth/google?next=https://evil.com"
# Expected: next cookie NOT set (only relative paths stored)

# Confirm PKCE method enforcement
curl -X POST http://localhost:3000/api/oauth/authorize \
  -d "code_challenge=abc&code_challenge_method=plain&client_id=...&redirect_uri=..."
# Expected: {"error":"invalid_request","error_description":"code_challenge_method must be S256"}

# Confirm DCR blocks javascript: scheme
curl -X POST http://localhost:3000/api/oauth/register \
  -H "Content-Type: application/json" \
  -d '{"client_name":"test","redirect_uris":["javascript:alert(1)"]}'
# Expected: {"error":"invalid_client_metadata","error_description":"Invalid redirect_uri scheme in: javascript:alert(1)"}

# Confirm security headers
curl -I http://localhost:3000
# Expected: X-Frame-Options: DENY, X-Content-Type-Options: nosniff in response headers
```
