# FILE 1 of 4: Database & API Foundation

## OVERVIEW

This file creates ALL new database tables and API routes needed for: pricing plans, usage tracking, plan enforcement, support tickets, admin notifications, coupon system, and Stripe billing prep. Everything else (admin panel UI, Stripe integration, public pages) depends on this foundation.

## CRITICAL RULES

1. DO NOT modify any existing GSC or GA4 tool files.
2. DO NOT break any existing functionality - all changes are ADDITIVE.
3. Never use em dashes in any content or copy. Use regular hyphens instead.
4. Run all migrations safely with IF NOT EXISTS / DO $$ checks.
5. All new API routes go under `src/app/api/` following Next.js App Router conventions.

---

## 1. DATABASE MIGRATION

Create a new migration file. If the project uses numbered migrations, name it accordingly (e.g., `003_platform_infrastructure.sql`). If migrations run from a single `schema.sql` or on startup, append to that file.

```sql
-- ============================================================
-- MIGRATION: Platform Infrastructure
-- Plans, Subscriptions, Coupons, Tickets, Admin Notifications
-- ============================================================

-- 1. PLANS TABLE
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  monthly_calls INTEGER NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  overage_price_per_1000_cents INTEGER DEFAULT 0,
  max_google_accounts INTEGER DEFAULT 1,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default plans
INSERT INTO plans (id, name, display_name, monthly_calls, price_cents, overage_price_per_1000_cents, max_google_accounts, features, sort_order)
VALUES
  ('plan_free', 'free', 'Free', 200, 0, 0, 1,
   '["200 tool calls/month", "GSC + GA4 access", "Single Google account"]'::jsonb, 0),
  ('plan_pro', 'pro', 'Pro', 1000, 1900, 1000, 3,
   '["1,000 tool calls/month", "Up to 3 Google accounts", "Priority support", "Overage: $10 per 1,000 calls"]'::jsonb, 1),
  ('plan_premium', 'premium', 'Premium', 5000, 4900, 800, 100,
   '["5,000 tool calls/month", "Unlimited Google accounts", "Early access to new integrations", "Overage: $8 per 1,000 calls"]'::jsonb, 2)
ON CONFLICT (name) DO NOTHING;

-- 2. USER SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  -- active, past_due, cancelled, trialing, expired
  calls_used INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  period_end TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  cancelled_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 3. COUPON CODES TABLE
CREATE TABLE IF NOT EXISTS coupon_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  duration_days INTEGER NOT NULL DEFAULT 30,
  max_redemptions INTEGER DEFAULT NULL,
  times_redeemed INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP(3),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed launch coupons
INSERT INTO coupon_codes (id, code, plan_id, duration_days, max_redemptions)
VALUES
  ('coupon_earlybird', 'EARLYBIRD', 'plan_premium', 30, 50),
  ('coupon_betauser', 'BETAUSER', 'plan_pro', 30, NULL)
ON CONFLICT (code) DO NOTHING;

-- 4. COUPON REDEMPTIONS TABLE
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coupon_id TEXT NOT NULL REFERENCES coupon_codes(id),
  redeemed_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP(3) NOT NULL,
  UNIQUE(user_id, coupon_id)
);

-- 5. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  -- general, connection_error, billing, feature_request, bug_report
  status TEXT NOT NULL DEFAULT 'open',
  -- open, in_progress, resolved, closed
  priority TEXT NOT NULL DEFAULT 'normal',
  -- low, normal, high, urgent
  admin_notes TEXT,
  resolved_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. TICKET MESSAGES TABLE (conversation thread)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  -- user, admin
  message TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. ADMIN NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS admin_notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  -- new_user, connection_error, ticket_opened, payment_failed,
  -- usage_limit_hit, token_expired, high_error_rate
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  -- info, warning, error, critical
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. ACTIVITY LOG TABLE (admin audit trail)
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  -- user_signup, user_login, tool_call, plan_change, coupon_redeemed,
  -- ticket_created, ticket_resolved, payment_success, payment_failed,
  -- connection_error, token_refresh, token_expired
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON coupon_codes(code);

-- 10. Add Stripe columns to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_active_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP(3);
  END IF;
END $$;
```

---

## 2. AUTO-PROVISION FREE PLAN ON SIGNUP

Find the code path where a new user is created (likely in the OAuth callback after Google auth). After creating the user row, also create their subscription:

```typescript
// After INSERT INTO users ...
// Auto-provision free plan subscription
await db.query(
  `INSERT INTO user_subscriptions (id, user_id, plan_id, status, calls_used, period_start, period_end)
   VALUES ($1, $2, 'plan_free', 'active', 0, NOW(), NOW() + INTERVAL '30 days')
   ON CONFLICT (user_id) DO NOTHING`,
  [generateId(), userId]
);

// Log activity
await db.query(
  `INSERT INTO activity_log (id, user_id, action, details)
   VALUES ($1, $2, 'user_signup', $3)`,
  [generateId(), userId, JSON.stringify({ email: userEmail, plan: 'free' })]
);

// Admin notification
await db.query(
  `INSERT INTO admin_notifications (id, type, title, message, severity, metadata)
   VALUES ($1, 'new_user', 'New user signed up', $2, 'info', $3)`,
  [generateId(), `${userEmail} just created an account`, JSON.stringify({ user_id: userId, email: userEmail })]
);
```

---

## 3. USAGE TRACKING MIDDLEWARE

This is the most critical piece. Every MCP tool call must be counted and checked against the plan limit.

Create a new file: `src/lib/usage.ts`

```typescript
import { db } from './db'; // adjust import path

interface UsageCheckResult {
  allowed: boolean;
  calls_used: number;
  calls_limit: number;
  plan_name: string;
  message?: string;
}

/**
 * Check if user can make a tool call and increment counter.
 * Call this at the START of every MCP tool handler.
 * Returns { allowed: true } if OK, or { allowed: false, message: "..." } if limit hit.
 */
export async function checkAndIncrementUsage(userId: string, toolName: string): Promise<UsageCheckResult> {
  // Get user's current subscription and plan
  const result = await db.query(
    `SELECT us.id as sub_id, us.calls_used, us.period_end, us.status,
            p.monthly_calls, p.name as plan_name, p.display_name
     FROM user_subscriptions us
     JOIN plans p ON us.plan_id = p.id
     WHERE us.user_id = $1`,
    [userId]
  );

  // If no subscription found, create free plan
  if (result.rows.length === 0) {
    const subId = generateId();
    await db.query(
      `INSERT INTO user_subscriptions (id, user_id, plan_id, status, calls_used, period_start, period_end)
       VALUES ($1, $2, 'plan_free', 'active', 0, NOW(), NOW() + INTERVAL '30 days')`,
      [subId, userId]
    );
    // Re-query
    return checkAndIncrementUsage(userId, toolName);
  }

  const sub = result.rows[0];

  // Check if period has expired - reset counter
  if (new Date(sub.period_end) < new Date()) {
    await db.query(
      `UPDATE user_subscriptions
       SET calls_used = 0,
           period_start = NOW(),
           period_end = NOW() + INTERVAL '30 days',
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
    sub.calls_used = 0;
  }

  // Check if subscription is active
  if (sub.status !== 'active' && sub.status !== 'trialing') {
    return {
      allowed: false,
      calls_used: sub.calls_used,
      calls_limit: sub.monthly_calls,
      plan_name: sub.plan_name,
      message: `Your subscription is ${sub.status}. Please update your billing at [APP_URL]/dashboard/billing to continue.`
    };
  }

  // Check if over limit
  if (sub.calls_used >= sub.monthly_calls) {
    // Log that user hit limit (for admin notification)
    await db.query(
      `INSERT INTO admin_notifications (id, type, title, message, severity, metadata)
       VALUES ($1, 'usage_limit_hit', 'User hit usage limit', $2, 'info', $3)
       ON CONFLICT DO NOTHING`,
      [
        `limit_${userId}_${new Date().toISOString().slice(0, 10)}`,
        `User hit their ${sub.display_name} plan limit (${sub.monthly_calls} calls)`,
        JSON.stringify({ user_id: userId, plan: sub.plan_name, calls_used: sub.calls_used })
      ]
    );

    return {
      allowed: false,
      calls_used: sub.calls_used,
      calls_limit: sub.monthly_calls,
      plan_name: sub.plan_name,
      message: `You've used all ${sub.monthly_calls} tool calls for this month on the ${sub.display_name} plan. Upgrade your plan at [APP_URL]/dashboard/billing for more calls.`
    };
  }

  // Increment counter
  await db.query(
    `UPDATE user_subscriptions
     SET calls_used = calls_used + 1, updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );

  // Update user last_active_at
  await db.query(
    `UPDATE users SET last_active_at = NOW() WHERE id = $1`,
    [userId]
  );

  return {
    allowed: true,
    calls_used: sub.calls_used + 1,
    calls_limit: sub.monthly_calls,
    plan_name: sub.plan_name
  };
}

/**
 * Get usage stats for a user (for dashboard display)
 */
export async function getUsageStats(userId: string) {
  const sub = await db.query(
    `SELECT us.calls_used, us.period_start, us.period_end, us.status,
            p.name as plan_name, p.display_name, p.monthly_calls, p.price_cents,
            p.overage_price_per_1000_cents, p.features
     FROM user_subscriptions us
     JOIN plans p ON us.plan_id = p.id
     WHERE us.user_id = $1`,
    [userId]
  );

  if (sub.rows.length === 0) return null;
  return sub.rows[0];
}
```

---

## 4. INTEGRATE USAGE CHECK INTO EVERY MCP TOOL

In the MCP server setup file (likely `src/lib/mcp/server.ts` or wherever tool handlers are registered), wrap each tool's handler with the usage check.

**Option A: Middleware approach (preferred)**

If there's a central place where all tool calls pass through, add the check there:

```typescript
import { checkAndIncrementUsage } from '../usage';

// In the tool call handler/dispatcher:
async function handleToolCall(toolName: string, args: any, userId: string) {
  // Usage check BEFORE executing the tool
  const usage = await checkAndIncrementUsage(userId, toolName);

  if (!usage.allowed) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: usage.message,
          usage: {
            calls_used: usage.calls_used,
            calls_limit: usage.calls_limit,
            plan: usage.plan_name
          }
        })
      }],
      isError: true
    };
  }

  // Proceed with actual tool execution...
  // (existing tool dispatch logic)
}
```

**Option B: Per-tool approach (if no central dispatcher)**

At the very top of each tool handler function, add:

```typescript
const usage = await checkAndIncrementUsage(userId, 'get_search_analytics');
if (!usage.allowed) {
  return { content: [{ type: "text", text: usage.message }], isError: true };
}
```

**RECOMMENDATION:** Option A is far better. Find the central tool dispatcher and add the check there once, rather than editing every single tool file. Look for where `server.setRequestHandler` or similar MCP SDK method routes tool calls.

---

## 5. API ROUTES

### 5a. GET /api/usage - Get current user's usage stats

Create `src/app/api/usage/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getUsageStats } from '@/lib/usage';
// import your auth utility to get userId from request

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req); // implement based on existing auth
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stats = await getUsageStats(userId);
  if (!stats) return NextResponse.json({ error: 'No subscription found' }, { status: 404 });

  return NextResponse.json({
    plan: stats.plan_name,
    display_name: stats.display_name,
    calls_used: stats.calls_used,
    calls_limit: stats.monthly_calls,
    calls_remaining: Math.max(0, stats.monthly_calls - stats.calls_used),
    percentage_used: Math.round((stats.calls_used / stats.monthly_calls) * 100),
    period_start: stats.period_start,
    period_end: stats.period_end,
    status: stats.status,
    price_cents: stats.price_cents,
    features: stats.features
  });
}
```

### 5b. GET /api/plans - List all available plans

Create `src/app/api/plans/route.ts`:

```typescript
export async function GET() {
  const result = await db.query(
    `SELECT id, name, display_name, monthly_calls, price_cents,
            overage_price_per_1000_cents, max_google_accounts, features, sort_order
     FROM plans WHERE is_active = true ORDER BY sort_order ASC`
  );
  return NextResponse.json({ plans: result.rows });
}
```

### 5c. POST /api/coupons/redeem - Redeem a coupon code

Create `src/app/api/coupons/redeem/route.ts`:

```typescript
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });

  // Find coupon
  const coupon = await db.query(
    `SELECT * FROM coupon_codes WHERE code = $1 AND is_active = true`,
    [code.toUpperCase().trim()]
  );

  if (coupon.rows.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 404 });
  }

  const c = coupon.rows[0];

  // Check expiry
  if (c.expires_at && new Date(c.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
  }

  // Check max redemptions
  if (c.max_redemptions && c.times_redeemed >= c.max_redemptions) {
    return NextResponse.json({ error: 'This coupon has reached its maximum redemptions' }, { status: 400 });
  }

  // Check if user already redeemed this coupon
  const existing = await db.query(
    `SELECT id FROM coupon_redemptions WHERE user_id = $1 AND coupon_id = $2`,
    [userId, c.id]
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
  }

  // Apply coupon: upgrade user's plan
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + c.duration_days);

  // Update subscription to the coupon's plan
  await db.query(
    `UPDATE user_subscriptions
     SET plan_id = $1, status = 'active', calls_used = 0,
         period_start = NOW(), period_end = $2, updated_at = NOW()
     WHERE user_id = $3`,
    [c.plan_id, expiresAt, userId]
  );

  // Record redemption
  await db.query(
    `INSERT INTO coupon_redemptions (id, user_id, coupon_id, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [generateId(), userId, c.id, expiresAt]
  );

  // Increment redemption counter
  await db.query(
    `UPDATE coupon_codes SET times_redeemed = times_redeemed + 1 WHERE id = $1`,
    [c.id]
  );

  // Activity log
  await db.query(
    `INSERT INTO activity_log (id, user_id, action, details)
     VALUES ($1, $2, 'coupon_redeemed', $3)`,
    [generateId(), userId, JSON.stringify({ code: c.code, plan_id: c.plan_id, expires_at: expiresAt })]
  );

  // Get plan display name for response
  const plan = await db.query(`SELECT display_name, monthly_calls FROM plans WHERE id = $1`, [c.plan_id]);

  return NextResponse.json({
    success: true,
    message: `Coupon applied! You now have the ${plan.rows[0].display_name} plan with ${plan.rows[0].monthly_calls} calls/month until ${expiresAt.toLocaleDateString()}.`,
    plan: plan.rows[0].display_name,
    expires_at: expiresAt
  });
}
```

### 5d. Support Tickets API

Create `src/app/api/tickets/route.ts`:

```typescript
// GET - list user's tickets
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tickets = await db.query(
    `SELECT id, subject, category, status, priority, created_at, updated_at
     FROM support_tickets WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return NextResponse.json({ tickets: tickets.rows });
}

// POST - create new ticket
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, description, category } = await req.json();

  if (!subject || !description) {
    return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
  }

  const validCategories = ['general', 'connection_error', 'billing', 'feature_request', 'bug_report'];
  const ticketCategory = validCategories.includes(category) ? category : 'general';

  // Auto-detect priority for connection errors
  const priority = ticketCategory === 'connection_error' ? 'high' : 'normal';

  const ticketId = generateId();
  await db.query(
    `INSERT INTO support_tickets (id, user_id, subject, description, category, priority)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [ticketId, userId, subject, description, ticketCategory, priority]
  );

  // Create initial message
  await db.query(
    `INSERT INTO ticket_messages (id, ticket_id, sender_type, message)
     VALUES ($1, $2, 'user', $3)`,
    [generateId(), ticketId, description]
  );

  // Activity log
  await db.query(
    `INSERT INTO activity_log (id, user_id, action, details)
     VALUES ($1, $2, 'ticket_created', $3)`,
    [generateId(), userId, JSON.stringify({ ticket_id: ticketId, subject, category: ticketCategory })]
  );

  // Admin notification
  const user = await db.query(`SELECT email FROM users WHERE id = $1`, [userId]);
  await db.query(
    `INSERT INTO admin_notifications (id, type, title, message, severity, metadata)
     VALUES ($1, 'ticket_opened', $2, $3, $4, $5)`,
    [
      generateId(),
      `New support ticket: ${subject}`,
      `${user.rows[0]?.email || 'Unknown user'} opened a ${ticketCategory} ticket`,
      priority === 'high' ? 'warning' : 'info',
      JSON.stringify({ ticket_id: ticketId, user_id: userId, category: ticketCategory })
    ]
  );

  return NextResponse.json({ success: true, ticket_id: ticketId });
}
```

Create `src/app/api/tickets/[ticketId]/route.ts`:

```typescript
// GET - get single ticket with messages
export async function GET(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ticket = await db.query(
    `SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2`,
    [params.ticketId, userId]
  );

  if (ticket.rows.length === 0) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  const messages = await db.query(
    `SELECT id, sender_type, message, created_at
     FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC`,
    [params.ticketId]
  );

  return NextResponse.json({
    ticket: ticket.rows[0],
    messages: messages.rows
  });
}
```

Create `src/app/api/tickets/[ticketId]/messages/route.ts`:

```typescript
// POST - add message to ticket
export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ticket belongs to user
  const ticket = await db.query(
    `SELECT id, status FROM support_tickets WHERE id = $1 AND user_id = $2`,
    [params.ticketId, userId]
  );
  if (ticket.rows.length === 0) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  if (ticket.rows[0].status === 'closed') {
    return NextResponse.json({ error: 'Cannot reply to a closed ticket' }, { status: 400 });
  }

  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  await db.query(
    `INSERT INTO ticket_messages (id, ticket_id, sender_type, message)
     VALUES ($1, $2, 'user', $3)`,
    [generateId(), params.ticketId, message]
  );

  // Update ticket timestamp
  await db.query(
    `UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`,
    [params.ticketId]
  );

  return NextResponse.json({ success: true });
}
```

---

## 6. ADMIN AUTH MIDDLEWARE

Create `src/lib/admin-auth.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Check if the request is from an admin user.
 * Uses the existing Google OAuth session - just checks email match.
 */
export async function isAdmin(req: NextRequest): Promise<boolean> {
  if (!ADMIN_EMAIL) return false;

  // Get user from existing auth system
  // This depends on how your current auth works. Options:
  // 1. Check session cookie
  // 2. Check OAuth token
  // 3. Check a header set by your auth middleware
  const userId = await getUserIdFromRequest(req);
  if (!userId) return false;

  const user = await db.query(
    `SELECT email FROM users WHERE id = $1`,
    [userId]
  );

  return user.rows[0]?.email === ADMIN_EMAIL;
}

/**
 * Middleware wrapper for admin routes
 */
export function requireAdmin(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    const admin = await isAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(req, context);
  };
}
```

**IMPORTANT: Add this environment variable on Railway:**
```
ADMIN_EMAIL=your-google-email@gmail.com
```

---

## 7. ADMIN API ROUTES

All admin routes go under `src/app/api/admin/`. Every route must check `isAdmin()` first.

### 7a. GET /api/admin/dashboard - Admin dashboard overview

Create `src/app/api/admin/dashboard/route.ts`:

```typescript
export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Parallel queries for speed
  const [
    totalUsers, newUsersWeek, newUsersMonth,
    totalCallsToday, totalCallsWeek, totalCallsMonth,
    activeSubscriptions, planDistribution,
    openTickets, unreadNotifications,
    recentErrors, topTools
  ] = await Promise.all([
    // Total users
    db.query(`SELECT COUNT(*) as count FROM users`),
    // New users this week
    db.query(`SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'`),
    // New users this month
    db.query(`SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '30 days'`),
    // Total calls today
    db.query(`SELECT COUNT(*) as count FROM usage_logs WHERE created_at > NOW() - INTERVAL '1 day'`),
    // Total calls this week
    db.query(`SELECT COUNT(*) as count FROM usage_logs WHERE created_at > NOW() - INTERVAL '7 days'`),
    // Total calls this month
    db.query(`SELECT COUNT(*) as count FROM usage_logs WHERE created_at > NOW() - INTERVAL '30 days'`),
    // Active subscriptions by plan
    db.query(`
      SELECT p.display_name, COUNT(*) as count
      FROM user_subscriptions us JOIN plans p ON us.plan_id = p.id
      WHERE us.status = 'active'
      GROUP BY p.display_name ORDER BY count DESC
    `),
    // Plan distribution
    db.query(`
      SELECT p.name, p.display_name, p.price_cents, COUNT(us.id) as user_count
      FROM plans p LEFT JOIN user_subscriptions us ON p.id = us.plan_id AND us.status = 'active'
      WHERE p.is_active = true
      GROUP BY p.id ORDER BY p.sort_order
    `),
    // Open tickets
    db.query(`SELECT COUNT(*) as count FROM support_tickets WHERE status IN ('open', 'in_progress')`),
    // Unread notifications
    db.query(`SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = false`),
    // Recent errors (last 24h)
    db.query(`
      SELECT COUNT(*) as count FROM mcp_debug_logs
      WHERE created_at > NOW() - INTERVAL '1 day'
      AND (level = 'error' OR status = 'error')
    `),
    // Top tools by usage (last 7 days)
    db.query(`
      SELECT tool_name, COUNT(*) as call_count
      FROM usage_logs WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY tool_name ORDER BY call_count DESC LIMIT 10
    `)
  ]);

  // Calculate MRR
  const mrrResult = await db.query(`
    SELECT COALESCE(SUM(p.price_cents), 0) as mrr_cents
    FROM user_subscriptions us
    JOIN plans p ON us.plan_id = p.id
    WHERE us.status = 'active' AND p.price_cents > 0
  `);

  return NextResponse.json({
    users: {
      total: parseInt(totalUsers.rows[0].count),
      new_this_week: parseInt(newUsersWeek.rows[0].count),
      new_this_month: parseInt(newUsersMonth.rows[0].count)
    },
    usage: {
      calls_today: parseInt(totalCallsToday.rows[0].count),
      calls_this_week: parseInt(totalCallsWeek.rows[0].count),
      calls_this_month: parseInt(totalCallsMonth.rows[0].count),
      top_tools: topTools.rows
    },
    subscriptions: activeSubscriptions.rows,
    plan_distribution: planDistribution.rows,
    tickets: { open: parseInt(openTickets.rows[0].count) },
    notifications: { unread: parseInt(unreadNotifications.rows[0].count) },
    errors: { last_24h: parseInt(recentErrors.rows[0].count) },
    revenue: {
      mrr_cents: parseInt(mrrResult.rows[0].mrr_cents),
      mrr_formatted: `$${(parseInt(mrrResult.rows[0].mrr_cents) / 100).toFixed(2)}`
    }
  });
}
```

### 7b. GET /api/admin/users - List all users with details

Create `src/app/api/admin/users/route.ts`:

```typescript
export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const search = req.nextUrl.searchParams.get('search') || '';
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = `
    SELECT u.id, u.email, u.created_at, u.last_active_at,
           us.plan_id, us.calls_used, us.status as sub_status,
           us.period_end,
           p.display_name as plan_name, p.monthly_calls,
           (SELECT COUNT(*) FROM gsc_properties gp WHERE gp.user_id = u.id AND gp.is_active = true) as gsc_count,
           (SELECT COUNT(*) FROM ga4_properties gap WHERE gap.user_id = u.id AND gap.is_active = true) as ga4_count,
           gc.scope
    FROM users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id
    LEFT JOIN plans p ON us.plan_id = p.id
    LEFT JOIN google_credentials gc ON u.id = gc.user_id
  `;

  const params: any[] = [];
  if (search) {
    query += ` WHERE u.email ILIKE $1`;
    params.push(`%${search}%`);
  }

  query += ` ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const users = await db.query(query, params);

  const total = await db.query(
    `SELECT COUNT(*) as count FROM users${search ? ' WHERE email ILIKE $1' : ''}`,
    search ? [`%${search}%`] : []
  );

  return NextResponse.json({
    users: users.rows,
    total: parseInt(total.rows[0].count),
    page,
    pages: Math.ceil(parseInt(total.rows[0].count) / limit)
  });
}
```

### 7c. GET /api/admin/notifications - Admin notifications

Create `src/app/api/admin/notifications/route.ts`:

```typescript
// GET - list notifications
export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

  const where = unreadOnly ? 'WHERE is_read = false' : '';
  const result = await db.query(
    `SELECT * FROM admin_notifications ${where}
     ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );

  return NextResponse.json({ notifications: result.rows });
}

// PATCH - mark as read
export async function PATCH(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { ids, mark_all } = await req.json();

  if (mark_all) {
    await db.query(`UPDATE admin_notifications SET is_read = true WHERE is_read = false`);
  } else if (ids?.length > 0) {
    await db.query(
      `UPDATE admin_notifications SET is_read = true WHERE id = ANY($1)`,
      [ids]
    );
  }

  return NextResponse.json({ success: true });
}
```

### 7d. Admin Ticket Management

Create `src/app/api/admin/tickets/route.ts`:

```typescript
// GET - list all tickets (admin view)
export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status'); // open, in_progress, resolved, closed

  let query = `
    SELECT st.*, u.email as user_email,
           (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = st.id) as message_count
    FROM support_tickets st
    JOIN users u ON st.user_id = u.id
  `;
  const params: any[] = [];

  if (status) {
    query += ` WHERE st.status = $1`;
    params.push(status);
  }

  query += ` ORDER BY
    CASE st.priority
      WHEN 'urgent' THEN 0
      WHEN 'high' THEN 1
      WHEN 'normal' THEN 2
      WHEN 'low' THEN 3
    END ASC,
    st.created_at DESC`;

  const tickets = await db.query(query, params);
  return NextResponse.json({ tickets: tickets.rows });
}
```

Create `src/app/api/admin/tickets/[ticketId]/route.ts`:

```typescript
// PATCH - update ticket (status, priority, admin_notes)
export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { status, priority, admin_notes } = await req.json();

  const updates: string[] = ['updated_at = NOW()'];
  const values: any[] = [];
  let paramIndex = 1;

  if (status) { updates.push(`status = $${paramIndex++}`); values.push(status); }
  if (priority) { updates.push(`priority = $${paramIndex++}`); values.push(priority); }
  if (admin_notes !== undefined) { updates.push(`admin_notes = $${paramIndex++}`); values.push(admin_notes); }
  if (status === 'resolved') { updates.push(`resolved_at = NOW()`); }

  values.push(params.ticketId);

  await db.query(
    `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return NextResponse.json({ success: true });
}
```

Create `src/app/api/admin/tickets/[ticketId]/messages/route.ts`:

```typescript
// POST - admin reply to ticket
export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  await db.query(
    `INSERT INTO ticket_messages (id, ticket_id, sender_type, message)
     VALUES ($1, $2, 'admin', $3)`,
    [generateId(), params.ticketId, message]
  );

  // Update ticket status to in_progress if it was open
  await db.query(
    `UPDATE support_tickets SET status = 'in_progress', updated_at = NOW()
     WHERE id = $1 AND status = 'open'`,
    [params.ticketId]
  );

  return NextResponse.json({ success: true });
}
```

### 7e. GET /api/admin/errors - Connection errors and debug logs

Create `src/app/api/admin/errors/route.ts`:

```typescript
export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const hours = parseInt(req.nextUrl.searchParams.get('hours') || '24');
  const service = req.nextUrl.searchParams.get('service'); // gsc, ga4, or null for all

  let query = `
    SELECT mdl.*, u.email as user_email
    FROM mcp_debug_logs mdl
    LEFT JOIN users u ON mdl.user_id = u.id
    WHERE mdl.created_at > NOW() - INTERVAL '${hours} hours'
  `;
  const params: any[] = [];

  if (service) {
    query += ` AND mdl.service = $1`;
    params.push(service);
  }

  query += ` ORDER BY mdl.created_at DESC LIMIT 200`;

  const errors = await db.query(query, params);

  // Also get error summary
  const summary = await db.query(`
    SELECT
      COALESCE(service, 'unknown') as service,
      COUNT(*) as error_count,
      COUNT(DISTINCT user_id) as affected_users
    FROM mcp_debug_logs
    WHERE created_at > NOW() - INTERVAL '${hours} hours'
    GROUP BY service
    ORDER BY error_count DESC
  `);

  // Users with expired/failing tokens
  const tokenIssues = await db.query(`
    SELECT u.id, u.email, gc.scope, gc.updated_at as token_updated_at
    FROM users u
    JOIN google_credentials gc ON u.id = gc.user_id
    WHERE gc.updated_at < NOW() - INTERVAL '6 hours'
    AND EXISTS (
      SELECT 1 FROM mcp_debug_logs mdl
      WHERE mdl.user_id = u.id
      AND mdl.created_at > NOW() - INTERVAL '24 hours'
    )
    ORDER BY gc.updated_at ASC
    LIMIT 20
  `);

  return NextResponse.json({
    errors: errors.rows,
    summary: summary.rows,
    token_issues: tokenIssues.rows
  });
}
```

### 7f. GET /api/admin/activity - Activity log

Create `src/app/api/admin/activity/route.ts`:

```typescript
export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
  const action = req.nextUrl.searchParams.get('action');
  const userId = req.nextUrl.searchParams.get('user_id');

  let query = `
    SELECT al.*, u.email as user_email
    FROM activity_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIdx = 1;

  if (action) {
    query += ` AND al.action = $${paramIdx++}`;
    params.push(action);
  }
  if (userId) {
    query += ` AND al.user_id = $${paramIdx++}`;
    params.push(userId);
  }

  query += ` ORDER BY al.created_at DESC LIMIT $${paramIdx}`;
  params.push(limit);

  const result = await db.query(query, params);
  return NextResponse.json({ activity: result.rows });
}
```

### 7g. Admin Coupon Management

Create `src/app/api/admin/coupons/route.ts`:

```typescript
// GET - list all coupons
export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const coupons = await db.query(`
    SELECT cc.*, p.display_name as plan_name,
           (SELECT COUNT(*) FROM coupon_redemptions cr WHERE cr.coupon_id = cc.id) as redemption_count
    FROM coupon_codes cc
    JOIN plans p ON cc.plan_id = p.id
    ORDER BY cc.created_at DESC
  `);

  return NextResponse.json({ coupons: coupons.rows });
}

// POST - create new coupon
export async function POST(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { code, plan_id, duration_days, max_redemptions, expires_at } = await req.json();

  if (!code || !plan_id) {
    return NextResponse.json({ error: 'Code and plan_id are required' }, { status: 400 });
  }

  await db.query(
    `INSERT INTO coupon_codes (id, code, plan_id, duration_days, max_redemptions, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [generateId(), code.toUpperCase().trim(), plan_id, duration_days || 30, max_redemptions || null, expires_at || null]
  );

  return NextResponse.json({ success: true });
}
```

### 7h. Admin User Management

Create `src/app/api/admin/users/[userId]/route.ts`:

```typescript
// PATCH - manually upgrade/downgrade user plan
export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { plan_id, reset_usage } = await req.json();

  if (plan_id) {
    await db.query(
      `UPDATE user_subscriptions SET plan_id = $1, updated_at = NOW()
       ${reset_usage ? ', calls_used = 0' : ''}
       WHERE user_id = $2`,
      [plan_id, params.userId]
    );

    await db.query(
      `INSERT INTO activity_log (id, user_id, action, details)
       VALUES ($1, $2, 'plan_change', $3)`,
      [generateId(), params.userId, JSON.stringify({ new_plan: plan_id, admin_action: true })]
    );
  }

  return NextResponse.json({ success: true });
}
```

---

## 8. CONNECTION ERROR AUTO-DETECTION

Add this to the error handling in MCP tools. Whenever a Google API call fails with a token/auth error, create an admin notification:

```typescript
// In your token refresh logic or API error handler:
async function logConnectionError(userId: string, service: string, error: string) {
  await db.query(
    `INSERT INTO admin_notifications (id, type, title, message, severity, metadata)
     VALUES ($1, 'connection_error', $2, $3, 'warning', $4)`,
    [
      generateId(),
      `Connection error for ${service.toUpperCase()}`,
      `User ${userId} - ${error}`,
      JSON.stringify({ user_id: userId, service, error })
    ]
  );

  await db.query(
    `INSERT INTO activity_log (id, user_id, action, details)
     VALUES ($1, $2, 'connection_error', $3)`,
    [generateId(), userId, JSON.stringify({ service, error })]
  );
}
```

Call this function in these places:
- When token refresh fails (401 from Google)
- When scope is insufficient (403 from Google)
- When a Google API returns 500/503
- When rate limit is hit (429)

---

## 9. ENVIRONMENT VARIABLES NEEDED

Add these to Railway:

```
ADMIN_EMAIL=your-google-email@gmail.com

# Stripe (will be used in File 3)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (for links in error messages)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 10. FILE STRUCTURE SUMMARY

New files to create:

```
src/
  lib/
    usage.ts                              -- Usage tracking & plan enforcement
    admin-auth.ts                         -- Admin authentication middleware
  app/
    api/
      usage/route.ts                      -- GET user usage stats
      plans/route.ts                      -- GET available plans
      coupons/redeem/route.ts             -- POST redeem coupon
      tickets/
        route.ts                          -- GET list, POST create
        [ticketId]/
          route.ts                        -- GET single ticket
          messages/route.ts               -- POST add message
      admin/
        dashboard/route.ts                -- GET admin overview
        users/
          route.ts                        -- GET list users
          [userId]/route.ts               -- PATCH manage user
        notifications/route.ts            -- GET/PATCH notifications
        tickets/
          route.ts                        -- GET all tickets
          [ticketId]/
            route.ts                      -- PATCH update ticket
            messages/route.ts             -- POST admin reply
        errors/route.ts                   -- GET error logs
        activity/route.ts                 -- GET activity log
        coupons/route.ts                  -- GET/POST coupons
migrations/
  003_platform_infrastructure.sql         -- All new tables
```

---

## 11. TESTING CHECKLIST

After implementing:
- [ ] Migration runs without errors
- [ ] New user gets auto-provisioned on Free plan
- [ ] Tool calls increment usage counter
- [ ] Tool call blocked when limit reached with friendly message
- [ ] Period resets when expired
- [ ] Coupon code EARLYBIRD upgrades to Premium
- [ ] Coupon code BETAUSER upgrades to Pro
- [ ] Duplicate coupon redemption blocked
- [ ] Support ticket creation works
- [ ] Ticket messages work
- [ ] Admin dashboard returns stats
- [ ] Admin can list/search users
- [ ] Admin notifications created on: new user, ticket, limit hit, connection error
- [ ] Admin can manage coupons
- [ ] Admin can upgrade/downgrade users
- [ ] All existing GSC and GA4 tools still work
- [ ] ADMIN_EMAIL env var correctly restricts admin routes
