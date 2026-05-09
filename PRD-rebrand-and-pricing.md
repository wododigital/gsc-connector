# PRD: OMG Bridge — Rebrand, Pricing Simplification & Website Refinement

**Project:** OMG Bridge (formerly "GSC Connector" / "OMG AI")
**Date:** 2026-05-10
**Owner:** WODO
**Status:** Ready for implementation

---

## 1. Overview

This PRD covers three tightly coupled changes to bridge.theomg.ai:

1. **Rebrand** — Rename the product from "OMG AI" to "OMG Bridge" everywhere, and change the MCP server display name to "omg connector"
2. **Pricing simplification** — Replace the current 3-tier model (Free/Pro/Premium) with 2 plans: Free (200 tool calls) and Annual ($199/year, unlimited)
3. **Website refinement** — Fix inconsistencies surfaced during audit (stale copy, mismatched tool counts, placeholder prices, design system drift between marketing and public pages)

---

## 2. Rebrand Scope

### 2.1 Product Name

| Context | Old | New |
|---------|-----|-----|
| Product name (UI, copy, meta tags) | OMG AI | OMG Bridge |
| MCP server `name` field | `omg-ai` | `omg-connector` |
| `package.json` name | `omg-ai-mcp` | `omg-bridge` |
| `package.json` description | mentions "OMG AI" | Use "OMG Bridge" |
| Claude Desktop config example key | `"omg-ai"` | `"omg-connector"` |
| Copyright footer | OMG AI | OMG Bridge |
| Page titles / meta tags | "OMG AI" | "OMG Bridge" |
| Alt text on logo images | "OMG AI" | "OMG Bridge" |

### 2.2 Files to Update (grep for `OMG AI`, `omg-ai`, `omg_ai`, `GSC Connect`, `GSC Connector`)

**MCP server:**
- `src/mcp/server.ts` — line 98: change `name: "omg-ai"` to `name: "omg-connector"`
- `src/mcp/server.ts` — line 2 comment: "GSC Connect" → "OMG Bridge"

**Package:**
- `package.json` — `name` field → `omg-bridge`, `description` → mention "OMG Bridge"

**Root layout:**
- `src/app/layout.tsx` — meta title: `"OMG Bridge - Google Search Console and Analytics for AI"`

**Marketing pages:**
- `src/app/(marketing)/layout.tsx` — all `alt="OMG AI"` → `alt="OMG Bridge"`
- `src/app/(marketing)/page.tsx` — all instances of "OMG AI" in copy → "OMG Bridge" (hero subtitle, footer, copyright). Also update the Claude Desktop config example from `"omg-ai"` to `"omg-connector"`

**Public pages:**
- `src/app/(public)/features/page.tsx` — meta title, body copy
- `src/app/(public)/faq/page.tsx` — meta title, meta description, all FAQ answers referencing "OMG AI"
- `src/app/(public)/guides/page.tsx` — meta title, meta description, setup instructions, Claude Desktop config key
- `src/app/(public)/pricing/page.tsx` — meta title
- `src/app/(public)/layout.tsx` — logo alt text, footer copyright

**Auth/Dashboard:**
- `src/app/auth/login/page.tsx` — meta title, alt text, body copy ("grant OMG Bridge read access"), subtitle
- `src/app/oauth/consent/page.tsx` — all "OMG AI" references
- `src/app/(dashboard)/dashboard/page.tsx` — meta title, subtitle ("Manage your OMG Bridge setup"), Claude Desktop config JSON key (`"omg-ai"` → `"omg-connector"`)
- `src/app/admin/layout.tsx` — logo alt text

**Types:**
- `src/types/index.ts` — comment "GSC Connect" → "OMG Bridge"

**Config:**
- `src/config/index.ts` — no code changes needed (uses generic env vars), but update top comment if it says "GSC Connect"

### 2.3 Logo Assets

The existing logo SVG files (`/public/OMG Rectangle LOGO Dark BG.svg`, `/public/OMG Icon SVG.svg`) can stay as-is since the visual brand mark remains the same. Only alt text and textual references change.

---

## 3. Pricing Simplification

### 3.1 New Plan Structure

| | Free | Annual |
|---|---|---|
| **ID** | `plan_free` | `plan_annual` |
| **Name (DB)** | `free` | `annual` |
| **Display Name** | Free | Annual |
| **Price** | $0 | $199/year |
| **Price in cents** | 0 | 19900 |
| **Billing cycle** | N/A | Yearly |
| **Tool calls** | 200/month | Unlimited |
| **Google accounts** | 1 | Unlimited |
| **Features list** | 1 Google account, 200 tool calls/month, All 30 MCP tools, GSC + GA4 + GBP access, Community support | Unlimited Google accounts, Unlimited tool calls, All 30 MCP tools, GSC + GA4 + GBP access, Priority support, Usage analytics |

### 3.2 Database Changes

**Seed file (`prisma/seed.ts`):**
- Remove `plan_pro` and `plan_premium` upserts
- Update `plan_free`: change `monthlyCalls` from 100 to 200, update features array
- Add `plan_annual`: `id: "plan_annual"`, `name: "annual"`, `displayName: "Annual"`, `monthlyCalls: -1` (or a very high number like 999999 to represent unlimited), `priceCents: 19900`, `maxGoogleAccounts: 999`, features array as above, `sortOrder: 1`
- Update coupon seeds if they reference `plan_pro` — point them to `plan_annual` instead

**Prisma schema (`prisma/schema.prisma`):**
- Line 23: the comment `// free, pro, agency` → `// free, annual`
- No schema migration needed — the Plan model is flexible enough

**Config tiers (`src/config/index.ts`):**
- Remove the `tiers` object entirely (it has hardcoded free/pro/agency limits that conflict with DB-driven plans), OR update it to match the new 2-plan structure:
```typescript
tiers: {
  free: { maxProperties: 1, dailyQueryLimit: 200 },
  annual: { maxProperties: 999, dailyQueryLimit: 999999 },
}
```
- Check if `tiers` is actually referenced anywhere in the codebase. If usage checks are DB-driven (via UserSubscription), remove the hardcoded tiers entirely.

**Stripe integration:**
- `src/app/api/stripe/checkout/route.ts` — ensure it handles yearly billing (Stripe price ID for $199/year needs to be created in Stripe dashboard and referenced)
- Add env var `STRIPE_ANNUAL_PRICE_ID` for the yearly Stripe price

### 3.3 UI Changes

**Marketing homepage (`src/app/(marketing)/page.tsx`) — PricingSection:**
- Replace 3-card grid with 2-card layout (max-width ~700px, centered)
- Free card: $0, "200 tool calls/month", features as above
- Annual card: $199/year (featured, with badge "Best value"), "Unlimited tool calls", features as above
- Remove placeholder `$X` prices
- Update hero badge from "Now in beta - free during launch" to "Free plan available — 200 tool calls/month"

**Public pricing page (`src/app/(public)/pricing/page.tsx`):**
- Replace 3-plan grid with 2-plan layout matching the new structure
- Update tool count from "23" to "30" in the bottom note
- Update copy: "All plans include GSC + GA4 + GBP integration, 30 MCP tools"

**Dashboard billing page (`src/app/(dashboard)/dashboard/billing/page.tsx`):**
- Will auto-update from DB since it fetches plans via `/api/plans`
- Ensure the grid handles 2 cards gracefully (change `sm:grid-cols-3` to `sm:grid-cols-2`)
- For unlimited plans, handle the usage bar display (show "Unlimited" instead of a progress bar when `calls_limit` is -1 or very high)

**FAQ page (`src/app/(public)/faq/page.tsx`):**
- Update "Is there a free plan?" answer: change "100 tool calls" to "200 tool calls"
- Update "What counts as a tool call?" answer: change "23 MCP tools" to "30 MCP tools"
- Remove or update any mention of Pro/Premium tiers

---

## 4. Website Refinement (Audit Findings)

### 4.1 Inconsistent Tool Counts

The codebase inconsistently references tool counts:
- Marketing homepage: "30 MCP tools" (correct)
- Features page: "13 MCP tools" for GSC, "10" for GA4 — totals 23
- FAQ page: "23 MCP tools" throughout
- Pricing page: "All 23 MCP tools"
- Guides page: "23 GSC and GA4 tools"

**Fix:** Audit `src/mcp/server.ts` to count actual registered tools. Update ALL pages to use the real count. The marketing homepage says 30 which includes GBP tools — if GBP isn't live yet, use the actual count and note "more coming soon" for GBP. If 30 is accurate, update everything to 30.

### 4.2 Design System Drift

The public pages (`/features`, `/pricing`, `/faq`, `/guides`) use Tailwind utility classes with a `zinc` color palette (e.g., `bg-zinc-900`, `text-zinc-400`, `border-zinc-800`), while the marketing homepage and dashboard use CSS custom properties (`var(--text-primary)`, `var(--glass-border)`, `var(--bg-deepest)`, etc.) from `globals-glass.css`.

**Fix:** Migrate the 4 public pages to use the glass design system CSS variables for visual consistency. Specifically:
- `bg-zinc-950` / `bg-zinc-900` → `background: var(--bg-deepest)` / `var(--bg-card)`
- `text-white` → `color: var(--text-primary)`
- `text-zinc-400` → `color: var(--text-secondary)`
- `text-zinc-500` → `color: var(--text-muted)`
- `border-zinc-800` → `border-color: var(--glass-border)`
- `bg-blue-600` → `background: var(--accent)`
- `text-green-400` → `color: var(--success)`

Alternatively, wrap public pages in the marketing layout (which already has the glass header/nav) instead of their own minimal layout.

### 4.3 Public Pages Missing Navigation

The public layout (`src/app/(public)/layout.tsx`) has a minimal header with just a logo and "Back to Dashboard" link. Users landing on `/features`, `/pricing`, `/faq`, or `/guides` have no way to navigate between these pages or back to the homepage without using the browser back button.

**Fix:** Either:
- (Recommended) Move public pages under the `(marketing)` route group so they share the full marketing nav (How it works, Features, Pricing, Guides, FAQ, Sign in, Get started)
- OR add the same nav links to the public layout

### 4.4 Stale Copy Fixes

| File | Issue | Fix |
|------|-------|-----|
| `src/app/(marketing)/page.tsx` hero badge | "Now in beta - free during launch" | "Free plan — 200 tool calls/month" |
| `src/app/(marketing)/page.tsx` CTA | "Connect Google - Free" | Keep as-is or change to "Get started free" |
| `src/app/auth/login/page.tsx` subtitle | "Connect Google Search Console to your AI tools" | "Connect Google Search Console, Analytics & Business Profile to your AI tools" |
| `src/app/(public)/features/page.tsx` | No GBP section | Add a GBP section with 7 tools (matching the marketing homepage's tool showcase) or note "Coming soon" |
| `src/app/(public)/features/page.tsx` bottom | "Works with your AI tools" lists "ChatGPT (coming soon)" | If ChatGPT OAuth works now, remove "(coming soon)" |
| `src/app/(public)/guides/page.tsx` | No GBP setup guide section | Add note about GBP or leave for future |
| `src/app/(public)/faq/page.tsx` description | "OMG AI GSC Connect" | "OMG Bridge" |

### 4.5 Pricing Page Duplication

There are TWO pricing sections:
1. Embedded in the marketing homepage (`PricingSection` component in `src/app/(marketing)/page.tsx`)
2. Standalone page at `src/app/(public)/pricing/page.tsx`

These show DIFFERENT plans with DIFFERENT prices and DIFFERENT feature lists. The homepage has Free/$X/$X (3 plans, no real prices), while `/pricing` has Free/$19/$49 (3 plans, hardcoded prices).

**Fix:** Both must show the same 2-plan structure. The standalone pricing page should ideally fetch from `/api/plans` (like the billing page does) so it stays in sync with the DB. The homepage pricing section can remain hardcoded for speed but must match.

---

## 5. Implementation Order

1. **Rebrand pass** — Find-and-replace all string references. This is safe and has no functional impact.
2. **Database/seed updates** — Update `prisma/seed.ts` with new plan structure. Run seed against dev DB to verify.
3. **Pricing UI** — Update marketing homepage, standalone pricing page, FAQ, and billing page.
4. **Design consistency** — Migrate public pages to glass design system or merge into marketing layout.
5. **Copy fixes** — Tool counts, stale badges, missing GBP references.
6. **Stripe config** — Create annual price in Stripe, add env var, test checkout flow.
7. **Test** — Verify all pages render correctly, pricing flows work, MCP server shows as "omg-connector" in Claude.

---

## 6. Files Changed (Complete List)

```
package.json
prisma/seed.ts
src/mcp/server.ts
src/config/index.ts
src/types/index.ts
src/app/layout.tsx
src/app/(marketing)/layout.tsx
src/app/(marketing)/page.tsx
src/app/(public)/pricing/page.tsx
src/app/(public)/features/page.tsx
src/app/(public)/faq/page.tsx
src/app/(public)/guides/page.tsx
src/app/(public)/layout.tsx
src/app/auth/login/page.tsx
src/app/oauth/consent/page.tsx
src/app/(dashboard)/dashboard/page.tsx
src/app/(dashboard)/dashboard/billing/page.tsx
src/app/admin/layout.tsx
```

---

## 7. Policy Pages (New)

The site currently has **zero legal/policy pages**. These are required for Google OAuth app verification, Stripe compliance, and general trust.

### 7.1 Pages to Create

| Page | Route | Purpose |
|------|-------|---------|
| Privacy Policy | `/privacy` | Required by Google OAuth, Stripe, and GDPR. Covers data collection, Google API data usage, token storage, third-party sharing. |
| Terms of Service | `/terms` | Required by Stripe. Covers acceptable use, account termination, liability, refund policy (7-day window per FAQ). |
| Cookie Policy | `/cookies` | Covers session cookies (`gsc_session`, `oauth_state`, `oauth_next`). No analytics or ad cookies. Can be a short page or section within Privacy Policy. |

### 7.2 File Locations

Create under the `(public)` route group (or `(marketing)` if public pages are merged into marketing layout per section 4.3):

```
src/app/(public)/privacy/page.tsx
src/app/(public)/terms/page.tsx
```

Cookie policy can be a separate page or a section within the privacy policy — keep it simple.

### 7.3 Content Requirements

**Privacy Policy must cover:**
- What data is collected (Google email, name, profile photo via OAuth)
- Google API Scopes requested: `openid`, `email`, `profile`, `webmasters.readonly`, `analytics.readonly`
- How tokens are stored (AES-256-GCM encrypted at rest)
- Data is never sold or shared with third parties
- Data is only used to respond to MCP tool calls from authorized AI sessions
- User can disconnect and delete data at any time from the dashboard
- How to revoke access via Google account security settings
- Contact email for data requests (projects.wodo@gmail.com or a dedicated privacy@ address)
- WODO as the operating entity behind OMG Bridge

**Terms of Service must cover:**
- Service description (MCP bridge for Google data)
- Account requirements (Google account with GSC/GA4 access)
- Acceptable use (no automated scraping, no reselling data)
- Plan limits and usage (tool call quotas per plan)
- Payment terms for Annual plan ($199/year, billed annually)
- 7-day refund policy (consistent with FAQ)
- Right to suspend/terminate accounts
- Limitation of liability
- Service provided "as is" — no uptime guarantees during beta/launch

**Both pages should:**
- Include a "Last updated" date
- Use the same glass design system as the rest of the site
- Be linked from the footer on all pages (marketing, public, dashboard)

### 7.4 Footer Updates

Add policy links to ALL footers:
- Marketing homepage footer (`src/app/(marketing)/page.tsx` — `Footer` component): add "Privacy Policy" and "Terms of Service" links
- Public layout footer (`src/app/(public)/layout.tsx`): add same links
- Dashboard layout (`src/app/(dashboard)/layout.tsx`): add links in sidebar or bottom area
- Login page (`src/app/auth/login/page.tsx`): update the consent copy to link to privacy policy and terms — e.g., "By signing in, you agree to our [Terms of Service](/terms) and [Privacy Policy](/privacy)."
- OAuth consent page (`src/app/oauth/consent/page.tsx`): add policy links

### 7.5 Google OAuth Consent Screen

The privacy policy URL (`https://bridge.theomg.ai/privacy`) and terms URL (`https://bridge.theomg.ai/terms`) should also be added to the Google Cloud Console OAuth consent screen configuration. This is a manual step in the Google Cloud Console under APIs & Services → OAuth consent screen.

---

## 8. Updated Files Changed (Complete List)

```
package.json
prisma/seed.ts
src/mcp/server.ts
src/config/index.ts
src/types/index.ts
src/app/layout.tsx
src/app/(marketing)/layout.tsx
src/app/(marketing)/page.tsx
src/app/(public)/privacy/page.tsx          ← NEW
src/app/(public)/terms/page.tsx            ← NEW
src/app/(public)/pricing/page.tsx
src/app/(public)/features/page.tsx
src/app/(public)/faq/page.tsx
src/app/(public)/guides/page.tsx
src/app/(public)/layout.tsx
src/app/auth/login/page.tsx
src/app/oauth/consent/page.tsx
src/app/(dashboard)/dashboard/page.tsx
src/app/(dashboard)/dashboard/billing/page.tsx
src/app/(dashboard)/layout.tsx
src/app/admin/layout.tsx
```

---

## 9. Updated Implementation Order

1. **Rebrand pass** — Find-and-replace all string references. Safe, no functional impact.
2. **Policy pages** — Create privacy policy and terms of service pages. Add footer links across all layouts.
3. **Database/seed updates** — Update `prisma/seed.ts` with new 2-plan structure. Run seed against dev DB.
4. **Pricing UI** — Update marketing homepage, standalone pricing page, FAQ, and billing page.
5. **Design consistency** — Migrate public pages to glass design system or merge into marketing layout.
6. **Copy fixes** — Tool counts, stale badges, missing GBP references.
7. **Stripe config** — Create annual price in Stripe, add env var, test checkout flow.
8. **Google Cloud Console** — Add privacy policy and terms URLs to OAuth consent screen.
9. **Test** — Verify all pages render, pricing flows work, MCP server shows as "omg-connector", policy pages are accessible and linked.

---

## 10. Out of Scope

- Logo/visual brand redesign (keeping existing OMG logo assets)
- GBP API integration code (pending API access approval from Google)
- Stripe subscription migration for existing paid users (none in production yet)
- New feature development
