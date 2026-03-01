/**
 * Edge case and input validation tests
 * - Malformed JSON bodies
 * - Missing required fields
 * - String length limits
 * - Category sanitization
 * - API key limits
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockDb, mockGetSession } from "./setup";

function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    contentType?: string;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "POST", body, contentType = "application/json", headers = {} } = options;
  const init: RequestInit = {
    method,
    headers: { "content-type": contentType, ...headers },
  };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

const fakeSession = {
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  subscriptionTier: "free" as const,
};

// ===================================================================
// POST /api/tickets - input validation
// ===================================================================
describe("POST /api/tickets - input validation", () => {
  let handler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetAllMocks();
    mockGetSession.mockResolvedValue(fakeSession);
    const mod = await import("@/app/api/tickets/route");
    handler = mod.POST;
  });

  it("returns 400 for malformed JSON", async () => {
    const req = makeRequest("/api/tickets", { body: "not-json{" });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when subject is missing", async () => {
    const req = makeRequest("/api/tickets", {
      body: { description: "some description", category: "general" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when subject exceeds 200 characters", async () => {
    const req = makeRequest("/api/tickets", {
      body: {
        subject: "a".repeat(201),
        description: "valid description",
        category: "general",
      },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/200/);
  });

  it("returns 400 when description exceeds 5000 characters", async () => {
    const req = makeRequest("/api/tickets", {
      body: {
        subject: "valid subject",
        description: "x".repeat(5001),
        category: "general",
      },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/5000/);
  });

  it("sanitizes unknown category to general", async () => {
    mockDb.supportTicket.create.mockResolvedValueOnce({
      id: "ticket-1",
      subject: "test",
      status: "open",
      category: "general",
      createdAt: new Date(),
      messages: [],
    });
    const req = makeRequest("/api/tickets", {
      body: {
        subject: "Valid subject",
        description: "Valid description",
        category: "INJECT_CATEGORY",
      },
    });
    const res = await handler(req);
    // Request succeeds with sanitized category
    expect([200, 201]).toContain(res.status);
    const createCall = mockDb.supportTicket.create.mock.calls[0];
    if (createCall) {
      expect(createCall[0].data.category).toBe("general");
    }
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const req = makeRequest("/api/tickets", {
      body: { subject: "test", description: "test", category: "general" },
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });
});

// ===================================================================
// POST /api/coupons/redeem - input validation
// ===================================================================
describe("POST /api/coupons/redeem - input validation", () => {
  let handler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetAllMocks();
    mockGetSession.mockResolvedValue(fakeSession);
    const mod = await import("@/app/api/coupons/redeem/route");
    handler = mod.POST;
  });

  it("returns 400 for malformed JSON", async () => {
    const req = makeRequest("/api/coupons/redeem", { body: "{invalid" });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when code is missing", async () => {
    const req = makeRequest("/api/coupons/redeem", { body: {} });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when code exceeds 50 characters", async () => {
    const req = makeRequest("/api/coupons/redeem", {
      body: { code: "x".repeat(51) },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid coupon/i);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const req = makeRequest("/api/coupons/redeem", { body: { code: "PROMO50" } });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });
});

// ===================================================================
// POST /api/keys - API key limits
// ===================================================================
describe("POST /api/keys - limits", () => {
  let handler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetAllMocks();
    mockGetSession.mockResolvedValue(fakeSession);
    const mod = await import("@/app/api/keys/route");
    handler = mod.POST;
  });

  it("returns 400 when user already has 10 active keys", async () => {
    mockDb.apiKey.count.mockResolvedValueOnce(10);
    const req = makeRequest("/api/keys", { body: { name: "New Key" } });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/maximum/i);
  });

  it("returns 400 when key name exceeds 100 characters", async () => {
    mockDb.apiKey.count.mockResolvedValueOnce(0);
    const req = makeRequest("/api/keys", {
      body: { name: "x".repeat(101) },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/100/);
  });

  it("creates key and returns it once when valid", async () => {
    mockDb.apiKey.count.mockResolvedValueOnce(0);
    mockDb.apiKey.create.mockResolvedValueOnce({
      id: "key-1",
      keyPrefix: "gsc_abc123",
      name: "My Key",
      isActive: true,
      lastUsedAt: null,
      createdAt: new Date(),
    });
    const req = makeRequest("/api/keys", { body: { name: "My Key" } });
    const res = await handler(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.key).toMatch(/^gsc_/);
    expect(body.warning).toBeTruthy();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const req = makeRequest("/api/keys", { body: {} });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });
});

// ===================================================================
// GET /api/usage - auth check
// ===================================================================
describe("GET /api/usage - auth check", () => {
  let handler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import("@/app/api/usage/route");
    handler = mod.GET;
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const req = new NextRequest(new URL("/api/usage", "http://localhost:3000"));
    const res = await handler(req);
    expect(res.status).toBe(401);
  });
});
