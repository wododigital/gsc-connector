/**
 * Vitest global setup - mocks for Prisma, auth, Stripe, and Next.js internals.
 * All tests run without a real database or external services.
 */

import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock Prisma client (@/lib/db)
// ---------------------------------------------------------------------------
// Each model exposes common Prisma methods as vi.fn() stubs.
// Individual tests override return values via mockResolvedValueOnce, etc.

function makePrismaModel() {
  return {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    groupBy: vi.fn().mockResolvedValue([]),
  };
}

export const mockDb = {
  user: makePrismaModel(),
  googleCredential: makePrismaModel(),
  gscProperty: makePrismaModel(),
  ga4Property: makePrismaModel(),
  apiKey: makePrismaModel(),
  oAuthClient: makePrismaModel(),
  oAuthToken: makePrismaModel(),
  oAuthAuthorizationCode: makePrismaModel(),
  usageLog: makePrismaModel(),
  mcpDebugLog: makePrismaModel(),
  userSubscription: makePrismaModel(),
  plan: makePrismaModel(),
  couponCode: makePrismaModel(),
  couponRedemption: makePrismaModel(),
  supportTicket: makePrismaModel(),
  ticketMessage: makePrismaModel(),
  adminNotification: makePrismaModel(),
  activityLog: makePrismaModel(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

vi.mock("@/lib/db", () => ({ default: mockDb }));

// ---------------------------------------------------------------------------
// Mock @/lib/auth
// ---------------------------------------------------------------------------
export const mockGetSession = vi.fn().mockResolvedValue(null);
export const mockCreateSessionToken = vi.fn().mockResolvedValue("mock-jwt-token");
export const mockVerifySessionToken = vi.fn().mockResolvedValue({
  sub: "user-1",
  email: "test@example.com",
  name: "Test User",
  tier: "free",
});

vi.mock("@/lib/auth", () => ({
  getSession: mockGetSession,
  createSessionToken: mockCreateSessionToken,
  verifySessionToken: mockVerifySessionToken,
  getSessionCookieOptions: vi.fn().mockReturnValue({
    name: "gsc_session",
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 604800,
    path: "/",
  }),
}));

// ---------------------------------------------------------------------------
// Mock @/lib/admin-auth
// ---------------------------------------------------------------------------
// These are re-exported so individual tests can override behavior.
// By default, requireAdmin returns 401 (unauthenticated).
import { NextResponse } from "next/server";

export const mockRequireAdmin = vi.fn().mockResolvedValue(
  NextResponse.json({ error: "Unauthorized" }, { status: 401 })
);
export const mockIsAdmin = vi.fn().mockResolvedValue(false);

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
  isAdmin: (...args: unknown[]) => mockIsAdmin(...args),
}));

// ---------------------------------------------------------------------------
// Mock @/lib/stripe
// ---------------------------------------------------------------------------
export const mockStripe = {
  customers: { create: vi.fn(), retrieve: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  billingPortal: { sessions: { create: vi.fn() } },
  webhooks: {
    constructEvent: vi.fn(),
  },
};

vi.mock("@/lib/stripe", () => ({
  stripe: mockStripe,
  PLAN_PRICE_MAP: { plan_pro: "price_pro_123", plan_premium: "price_premium_456" },
  PRICE_PLAN_MAP: { price_pro_123: "plan_pro", price_premium_456: "plan_premium" },
  getOrCreateStripeCustomer: vi.fn().mockResolvedValue("cus_mock_123"),
}));

// ---------------------------------------------------------------------------
// Mock @/lib/usage
// ---------------------------------------------------------------------------
export const mockCheckAndIncrementUsage = vi.fn().mockResolvedValue({
  allowed: true,
  callsUsed: 1,
  callsLimit: 100,
  callsRemaining: 99,
  planName: "free",
});

vi.mock("@/lib/usage", () => ({
  checkAndIncrementUsage: (...args: unknown[]) => mockCheckAndIncrementUsage(...args),
  getUserUsage: vi.fn().mockResolvedValue({
    plan: "plan_free",
    display_name: "Free",
    calls_used: 0,
    calls_limit: 100,
    calls_remaining: 100,
    percentage_used: 0,
  }),
  provisionFreePlan: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Mock @/config/index
// ---------------------------------------------------------------------------
vi.mock("@/config/index", () => ({
  config: {
    env: "test",
    app: {
      url: "http://localhost:3000",
      secret: "test-secret-0123456789abcdef0123456789abcdef",
      encryptionKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    },
    ports: { web: 3000, mcp: 3001 },
    database: { url: "postgresql://test@localhost:5432/testdb" },
    google: {
      clientId: "test-google-client-id",
      clientSecret: "test-google-client-secret",
      redirectUri: "http://localhost:3000/api/gsc/callback",
      apiKey: "",
    },
    jwt: { accessTokenTtl: 3600, refreshTokenTtl: 2592000 },
    rateLimits: { mcpRequestsPerMinute: 100, authRequestsPerMinute: 10 },
    tiers: {
      free: { maxProperties: 1, dailyQueryLimit: 100 },
      pro: { maxProperties: 10, dailyQueryLimit: 10000 },
      agency: { maxProperties: 100, dailyQueryLimit: 100000 },
    },
  },
  validateConfig: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock next/headers (cookies)
// ---------------------------------------------------------------------------
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: vi.fn().mockReturnValue(new Headers()),
}));

// ---------------------------------------------------------------------------
// Set test environment variables
// (NODE_ENV is set to "test" automatically by vitest - do not set here)
// ---------------------------------------------------------------------------
process.env.APP_SECRET = "test-secret-0123456789abcdef0123456789abcdef";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.DATABASE_URL = "postgresql://test@localhost:5432/testdb";
process.env.APP_URL = "http://localhost:3000";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.STRIPE_SECRET_KEY = "sk_test_fake";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_fake";
