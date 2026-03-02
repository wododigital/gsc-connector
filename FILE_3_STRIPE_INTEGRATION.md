# FILE 3 of 4: Stripe Integration

## OVERVIEW

Complete Stripe integration with test mode payment gateway. Covers: Stripe product/price creation, Checkout Sessions, Customer Portal, Webhook handling, subscription lifecycle management, and billing dashboard for users. All Stripe API calls use TEST keys - no real charges.

## PREREQUISITES

1. File 1 (Database & API Foundation) must be implemented first.
2. Create a Stripe account at https://dashboard.stripe.com
3. Stay in TEST MODE (toggle in top-right of Stripe dashboard).

## CRITICAL RULES

1. Never use em dashes. Use hyphens instead.
2. All Stripe operations use `stripe` npm package.
3. Never log or expose `STRIPE_SECRET_KEY` in client code.
4. Webhook signature verification is mandatory - never skip it.
5. All monetary values in Stripe are in CENTS (e.g., $19 = 1900).

---

## 1. STRIPE SETUP

### 1a. Install Stripe SDK

```bash
npm install stripe
```

### 1b. Environment Variables

Add to Railway:

```
STRIPE_SECRET_KEY=sk_test_...          # From Stripe Dashboard > Developers > API Keys
STRIPE_PUBLISHABLE_KEY=pk_test_...     # Same location (publishable key)
STRIPE_WEBHOOK_SECRET=whsec_...        # Created in step 1c below
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Same as above, for client-side
```

### 1c. Create Stripe Products and Prices (One-Time Setup)

Do this ONCE in Stripe Dashboard (Test Mode):

**Option A: Via Stripe Dashboard UI**
1. Go to Products > Add Product
2. Create "Pro Plan": $19/month recurring
3. Create "Premium Plan": $49/month recurring
4. Copy the Price IDs (price_xxx...) for each

**Option B: Via Script (recommended - run once)**

Create `scripts/setup-stripe.ts` (run locally, not in production):

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function setup() {
  // Create Pro product + price
  const proProduct = await stripe.products.create({
    name: 'OMG AI - Pro Plan',
    description: '1,000 tool calls/month, up to 3 Google accounts, priority support',
    metadata: { plan_id: 'plan_pro' }
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 1900, // $19.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan_id: 'plan_pro' }
  });

  // Create Premium product + price
  const premiumProduct = await stripe.products.create({
    name: 'OMG AI - Premium Plan',
    description: '5,000 tool calls/month, unlimited accounts, early access',
    metadata: { plan_id: 'plan_premium' }
  });

  const premiumPrice = await stripe.prices.create({
    product: premiumProduct.id,
    unit_amount: 4900, // $49.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan_id: 'plan_premium' }
  });

  console.log('=== STRIPE SETUP COMPLETE ===');
  console.log('Add these to your environment variables:');
  console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
  console.log(`STRIPE_PREMIUM_PRICE_ID=${premiumPrice.id}`);
}

setup().catch(console.error);
```

Run with: `npx ts-node scripts/setup-stripe.ts`

Then add the price IDs to Railway:
```
STRIPE_PRO_PRICE_ID=price_xxx...
STRIPE_PREMIUM_PRICE_ID=price_xxx...
```

### 1d. Create Stripe Webhook

1. In Stripe Dashboard: Developers > Webhooks > Add Endpoint
2. URL: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the Webhook Signing Secret (whsec_...) to `STRIPE_WEBHOOK_SECRET`

For local testing, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 2. STRIPE LIBRARY SETUP

Create `src/lib/stripe.ts`:

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia', // Use latest stable API version
  typescript: true,
});

// Plan ID to Stripe Price ID mapping
export const PLAN_PRICE_MAP: Record<string, string> = {
  plan_pro: process.env.STRIPE_PRO_PRICE_ID || '',
  plan_premium: process.env.STRIPE_PREMIUM_PRICE_ID || '',
};

export const PRICE_PLAN_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PLAN_PRICE_MAP).map(([k, v]) => [v, k])
);

/**
 * Get or create a Stripe Customer for a user.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const result = await db.query(
    `SELECT stripe_customer_id FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows[0]?.stripe_customer_id) {
    return result.rows[0].stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  // Save to database
  await db.query(
    `UPDATE users SET stripe_customer_id = $1 WHERE id = $2`,
    [customer.id, userId]
  );

  return customer.id;
}
```

---

## 3. CHECKOUT SESSION API

Create `src/app/api/stripe/checkout/route.ts`:

This creates a Stripe Checkout page where users pay. After payment, Stripe redirects back to your app.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLAN_PRICE_MAP, getOrCreateStripeCustomer } from '@/lib/stripe';
// import your auth utility

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan_id } = await req.json();

  // Validate plan
  const priceId = PLAN_PRICE_MAP[plan_id];
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Get user email
  const user = await db.query(`SELECT email FROM users WHERE id = $1`, [userId]);
  if (user.rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(userId, user.rows[0].email);

  // Check if customer already has an active subscription
  const existingSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  if (existingSubs.data.length > 0) {
    // User already has a subscription - redirect to portal to manage it
    return NextResponse.json({
      error: 'You already have an active subscription. Use the billing portal to change plans.',
      redirect: '/api/stripe/portal'
    }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/billing?cancelled=true`,
    metadata: {
      user_id: userId,
      plan_id: plan_id,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        plan_id: plan_id,
      },
    },
    allow_promotion_codes: true, // Let Stripe handle promo codes too
  });

  return NextResponse.json({ url: session.url });
}
```

---

## 4. CUSTOMER PORTAL API

Create `src/app/api/stripe/portal/route.ts`:

The Billing Portal lets users manage their subscription (upgrade, downgrade, cancel, update payment method) without you building any UI.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.query(`SELECT email, stripe_customer_id FROM users WHERE id = $1`, [userId]);
  if (!user.rows[0]?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found. Subscribe to a plan first.' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: user.rows[0].stripe_customer_id,
    return_url: `${appUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

**IMPORTANT:** You must configure the Customer Portal in Stripe Dashboard:
1. Go to: Settings > Billing > Customer Portal
2. Enable: "Allow customers to switch plans"
3. Add your products/prices
4. Enable: "Allow customers to cancel subscriptions"
5. Enable: "Allow customers to update payment methods"
6. Save

---

## 5. WEBHOOK HANDLER (Most Critical)

Create `src/app/api/stripe/webhook/route.ts`:

This is where Stripe tells your app about payment events. This is the source of truth for subscription state.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICE_PLAN_MAP } from '@/lib/stripe';
import Stripe from 'stripe';

// CRITICAL: Disable Next.js body parsing for webhooks
// Stripe needs the raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

// For App Router, we need to read the raw body ourselves
async function getRawBody(req: NextRequest): Promise<Buffer> {
  const reader = req.body?.getReader();
  const chunks: Uint8Array[] = [];

  if (!reader) throw new Error('No body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`Error handling ${event.type}:`, err);
    // Still return 200 so Stripe doesn't retry
    // Log to admin notifications for manual review
    await db.query(
      `INSERT INTO admin_notifications (id, type, title, message, severity, metadata)
       VALUES ($1, 'payment_failed', $2, $3, 'error', $4)`,
      [
        generateId(),
        `Webhook handler error: ${event.type}`,
        err.message,
        JSON.stringify({ event_type: event.type, event_id: event.id })
      ]
    );
  }

  return NextResponse.json({ received: true });
}

// ---- EVENT HANDLERS ----

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;

  if (!userId || !planId) {
    console.error('Checkout completed but missing metadata', session.id);
    return;
  }

  // Get the subscription ID from the session
  const subscriptionId = session.subscription as string;

  // Update user's subscription in our database
  await db.query(
    `UPDATE user_subscriptions
     SET plan_id = $1,
         status = 'active',
         calls_used = 0,
         period_start = NOW(),
         period_end = NOW() + INTERVAL '30 days',
         stripe_customer_id = $2,
         stripe_subscription_id = $3,
         updated_at = NOW()
     WHERE user_id = $4`,
    [planId, session.customer as string, subscriptionId, userId]
  );

  // Activity log
  await db.query(
    `INSERT INTO activity_log (id, user_id, action, details)
     VALUES ($1, $2, 'payment_success', $3)`,
    [
      generateId(),
      userId,
      JSON.stringify({
        plan_id: planId,
        stripe_session_id: session.id,
        amount: session.amount_total,
      })
    ]
  );

  // Admin notification
  const user = await db.query(`SELECT email FROM users WHERE id = $1`, [userId]);
  await db.query(
    `INSERT INTO admin_notifications (id, type, title, message, severity, metadata)
     VALUES ($1, 'payment_success', $2, $3, 'info', $4)`,
    [
      generateId(),
      'New subscription!',
      `${user.rows[0]?.email} subscribed to ${planId} ($${(session.amount_total || 0) / 100})`,
      JSON.stringify({ user_id: userId, plan_id: planId, amount: session.amount_total })
    ]
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  // Determine the plan from the price
  const priceId = subscription.items.data[0]?.price?.id;
  const planId = priceId ? PRICE_PLAN_MAP[priceId] : null;

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    trialing: 'trialing',
  };

  const ourStatus = statusMap[subscription.status] || 'active';

  const updates: any = {
    status: ourStatus,
    updated_at: new Date(),
  };

  if (planId) updates.plan_id = planId;

  // Convert Stripe period to our period
  if (subscription.current_period_start && subscription.current_period_end) {
    updates.period_start = new Date(subscription.current_period_start * 1000);
    updates.period_end = new Date(subscription.current_period_end * 1000);
  }

  if (subscription.canceled_at) {
    updates.cancelled_at = new Date(subscription.canceled_at * 1000);
  }

  // Build dynamic UPDATE query
  const setClauses: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = $${idx++}`);
    values.push(value);
  }
  values.push(userId);

  await db.query(
    `UPDATE user_subscriptions SET ${setClauses.join(', ')} WHERE user_id = $${idx}`,
    values
  );

  // Activity log
  await db.query(
    `INSERT INTO activity_log (id, user_id, action, details)
     VALUES ($1, $2, 'plan_change', $3)`,
    [
      generateId(),
      userId,
      JSON.stringify({
        new_status: ourStatus,
        new_plan: planId,
        stripe_status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
    ]
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  // Downgrade to free plan
  await db.query(
    `UPDATE user_subscriptions
     SET plan_id = 'plan_free',
         status = 'active',
         calls_used = 0,
         stripe_subscription_id = NULL,
         cancelled_at = NOW(),
         period_start = NOW(),
         period_end = NOW() + INTERVAL '30 days',
         updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );

  // Admin notification
  const user = await db.query(`SELECT email FROM users WHERE id = $1`, [userId]);
  await db.query(
    `INSERT INTO admin_notifications (id, type, title, message, severity, metadata)
     VALUES ($1, 'subscription_cancelled', $2, $3, 'warning', $4)`,
    [
      generateId(),
      'Subscription cancelled',
      `${user.rows[0]?.email} cancelled their subscription`,
      JSON.stringify({ user_id: userId })
    ]
  );
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // For recurring payments after the initial checkout
  const customerId = invoice.customer as string;
  const user = await db.query(
    `SELECT id FROM users WHERE stripe_customer_id = $1`,
    [customerId]
  );

  if (user.rows.length === 0) return;
  const userId = user.rows[0].id;

  // Reset usage counter on successful payment (new billing period)
  await db.query(
    `UPDATE user_subscriptions
     SET calls_used = 0, updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );

  await db.query(
    `INSERT INTO activity_log (id, user_id, action, details)
     VALUES ($1, $2, 'payment_success', $3)`,
    [
      generateId(),
      userId,
      JSON.stringify({ amount: invoice.amount_paid, invoice_id: invoice.id })
    ]
  );
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const user = await db.query(
    `SELECT id, email FROM users WHERE stripe_customer_id = $1`,
    [customerId]
  );

  if (user.rows.length === 0) return;
  const userId = user.rows[0].id;

  // Mark subscription as past_due
  await db.query(
    `UPDATE user_subscriptions SET status = 'past_due', updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );

  // Critical admin notification
  await db.query(
    `INSERT INTO admin_notifications (id, type, title, message, severity, metadata)
     VALUES ($1, 'payment_failed', $2, $3, 'error', $4)`,
    [
      generateId(),
      'Payment failed!',
      `${user.rows[0].email} - payment of $${((invoice.amount_due || 0) / 100).toFixed(2)} failed`,
      JSON.stringify({ user_id: userId, invoice_id: invoice.id, amount: invoice.amount_due })
    ]
  );

  await db.query(
    `INSERT INTO activity_log (id, user_id, action, details)
     VALUES ($1, $2, 'payment_failed', $3)`,
    [
      generateId(),
      userId,
      JSON.stringify({ amount: invoice.amount_due, invoice_id: invoice.id })
    ]
  );
}
```

---

## 6. BILLING DASHBOARD PAGE (User-Facing)

Create `src/app/dashboard/billing/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface UsageData {
  plan: string;
  display_name: string;
  calls_used: number;
  calls_limit: number;
  calls_remaining: number;
  percentage_used: number;
  period_start: string;
  period_end: string;
  status: string;
  price_cents: number;
  features: string[];
}

interface Plan {
  id: string;
  name: string;
  display_name: string;
  monthly_calls: number;
  price_cents: number;
  features: string[];
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const success = searchParams.get('success');
  const cancelled = searchParams.get('cancelled');

  useEffect(() => {
    Promise.all([
      fetch('/api/usage').then(r => r.json()),
      fetch('/api/plans').then(r => r.json()),
    ]).then(([usageData, plansData]) => {
      setUsage(usageData);
      setPlans(plansData.plans || []);
      setLoading(false);
    });
  }, []);

  const handleCheckout = async (planId: string) => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Failed to start checkout');
    }
  };

  const handlePortal = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Failed to open billing portal');
    }
  };

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await fetch('/api/coupons/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode }),
    });
    const data = await res.json();
    setCouponMessage(data.message || data.error);
    if (data.success) {
      setCouponCode('');
      // Refresh usage data
      const updated = await fetch('/api/usage').then(r => r.json());
      setUsage(updated);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading billing info...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Success/Cancel Messages */}
      {success && (
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-green-300 text-sm">
          Payment successful! Your plan has been upgraded. Welcome aboard!
        </div>
      )}
      {cancelled && (
        <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 text-yellow-300 text-sm">
          Checkout was cancelled. No charges were made.
        </div>
      )}

      {/* Current Plan & Usage */}
      {usage && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Current Plan: {usage.display_name}</h2>
              <p className="text-sm text-gray-400">
                {usage.price_cents > 0 ? `$${(usage.price_cents / 100).toFixed(0)}/month` : 'Free'}
                {usage.status !== 'active' && (
                  <span className="ml-2 text-yellow-400">({usage.status})</span>
                )}
              </p>
            </div>
            {usage.price_cents > 0 && (
              <button
                onClick={handlePortal}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm"
              >
                Manage Subscription
              </button>
            )}
          </div>

          {/* Usage Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Tool calls used this period</span>
              <span className="text-white font-medium">
                {usage.calls_used} / {usage.calls_limit}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usage.percentage_used >= 90 ? 'bg-red-500' :
                  usage.percentage_used >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, usage.percentage_used)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Resets on {new Date(usage.period_end).toLocaleDateString()}
              {' - '}{usage.calls_remaining} calls remaining
            </p>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Available Plans</h2>
        <div className="grid grid-cols-3 gap-4">
          {plans.map(plan => {
            const isCurrentPlan = usage?.plan === plan.name;
            const isUpgrade = (plan.price_cents || 0) > (usage?.price_cents || 0);
            const isFree = plan.price_cents === 0;

            return (
              <div
                key={plan.id}
                className={`bg-gray-900 border rounded-lg p-5 ${
                  isCurrentPlan ? 'border-blue-500' : 'border-gray-800'
                }`}
              >
                <h3 className="text-lg font-bold text-white">{plan.display_name}</h3>
                <p className="text-2xl font-bold text-white mt-2">
                  {plan.price_cents > 0 ? `$${(plan.price_cents / 100).toFixed(0)}` : 'Free'}
                  {plan.price_cents > 0 && <span className="text-sm text-gray-400 font-normal">/month</span>}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {plan.monthly_calls.toLocaleString()} tool calls/month
                </p>

                <ul className="mt-4 space-y-2">
                  {(plan.features as any)?.map?.((feature: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isCurrentPlan ? (
                    <span className="block text-center py-2 text-sm text-blue-400 font-medium">
                      Current Plan
                    </span>
                  ) : isFree ? (
                    <span className="block text-center py-2 text-sm text-gray-500">
                      Included
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      className={`w-full py-2 rounded-lg text-sm font-medium ${
                        isUpgrade
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {isUpgrade ? 'Upgrade' : 'Switch Plan'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coupon Code */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Have a coupon code?</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white
                       placeholder-gray-500 text-sm w-64 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleCoupon}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
          >
            Apply
          </button>
        </div>
        {couponMessage && (
          <p className={`text-sm mt-2 ${couponMessage.includes('applied') || couponMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
            {couponMessage}
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## 7. ADMIN REVENUE TRACKING API

Add revenue tracking to the admin dashboard API. This extends the `/api/admin/dashboard` route from File 1.

Create `src/app/api/admin/revenue/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Revenue from our database
  const mrrResult = await db.query(`
    SELECT COALESCE(SUM(p.price_cents), 0) as mrr_cents
    FROM user_subscriptions us
    JOIN plans p ON us.plan_id = p.id
    WHERE us.status = 'active' AND p.price_cents > 0
  `);

  // Subscriber counts
  const subscribers = await db.query(`
    SELECT p.display_name, p.price_cents, COUNT(*) as count
    FROM user_subscriptions us
    JOIN plans p ON us.plan_id = p.id
    WHERE us.status = 'active' AND p.price_cents > 0
    GROUP BY p.display_name, p.price_cents
  `);

  // Recent payment activity
  const recentPayments = await db.query(`
    SELECT al.*, u.email
    FROM activity_log al
    JOIN users u ON al.user_id = u.id
    WHERE al.action IN ('payment_success', 'payment_failed')
    ORDER BY al.created_at DESC
    LIMIT 20
  `);

  // Churn - cancelled in last 30 days
  const churn = await db.query(`
    SELECT COUNT(*) as count
    FROM user_subscriptions
    WHERE cancelled_at > NOW() - INTERVAL '30 days'
  `);

  // Coupon impact
  const couponImpact = await db.query(`
    SELECT cc.code, p.display_name as plan_name, COUNT(cr.id) as redemptions
    FROM coupon_redemptions cr
    JOIN coupon_codes cc ON cr.coupon_id = cc.id
    JOIN plans p ON cc.plan_id = p.id
    WHERE cr.redeemed_at > NOW() - INTERVAL '30 days'
    GROUP BY cc.code, p.display_name
  `);

  const mrrCents = parseInt(mrrResult.rows[0].mrr_cents);

  return NextResponse.json({
    mrr: {
      cents: mrrCents,
      formatted: `$${(mrrCents / 100).toFixed(2)}`,
      arr_formatted: `$${((mrrCents * 12) / 100).toFixed(2)}`,
    },
    subscribers: subscribers.rows,
    recent_payments: recentPayments.rows,
    churn_30d: parseInt(churn.rows[0].count),
    coupon_impact: couponImpact.rows,
  });
}
```

---

## 8. STRIPE TEST CARDS

For testing, use these Stripe test card numbers:

| Card Number | Scenario |
|---|---|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 3220 | 3D Secure (requires auth) |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0341 | Attaching fails |

Use any future expiry date, any 3-digit CVC, any ZIP code.

---

## 9. FILE STRUCTURE SUMMARY

New files:

```
src/
  lib/
    stripe.ts                           -- Stripe client, helpers
  app/
    api/
      stripe/
        checkout/route.ts               -- POST create checkout session
        portal/route.ts                 -- POST create billing portal session
        webhook/route.ts                -- POST webhook handler (5 events)
      admin/
        revenue/route.ts                -- GET revenue analytics
    dashboard/
      billing/page.tsx                  -- User billing page with plan cards
scripts/
  setup-stripe.ts                       -- One-time Stripe product setup
```

---

## 10. TESTING CHECKLIST

- [ ] Stripe SDK installed and configured
- [ ] Products and prices created in Stripe test mode
- [ ] Checkout flow works: click Upgrade, go to Stripe, pay with 4242..., return to success page
- [ ] Webhook receives `checkout.session.completed` and updates database
- [ ] User's plan changes in database after payment
- [ ] Usage counter resets on new subscription
- [ ] Customer Portal works: user can manage subscription
- [ ] Cancel flow: subscription deleted, user downgraded to Free
- [ ] Payment failure: user marked as past_due, admin notified
- [ ] Coupon redemption still works alongside Stripe
- [ ] Billing page shows current plan, usage bar, plan cards
- [ ] Admin revenue endpoint returns MRR and subscriber data
- [ ] Admin dashboard shows payment notifications
- [ ] Stripe test card 4242... processes successfully
- [ ] Stripe test card 9995 triggers failure webhook
- [ ] Webhook signature verification rejects tampered requests
