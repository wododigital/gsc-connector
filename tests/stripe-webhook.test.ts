/**
 * Stripe webhook tests
 * Verifies signature validation and event handling.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockDb, mockStripe } from "./setup";

function makeWebhookRequest(body: string, signature?: string): NextRequest {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (signature) {
    headers["stripe-signature"] = signature;
  }
  return new NextRequest(new URL("/api/stripe/webhook", "http://localhost:3000"), {
    method: "POST",
    body,
    headers,
  });
}

describe("POST /api/stripe/webhook", () => {
  let handler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import("@/app/api/stripe/webhook/route");
    handler = mod.POST;
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    // No signature header
    const req = makeWebhookRequest('{"type":"test"}');
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/signature/i);
  });

  it("returns 400 when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    const original = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const req = makeWebhookRequest('{"type":"test"}', "t=123,v1=abc");
    const res = await handler(req);
    expect(res.status).toBe(400);
    process.env.STRIPE_WEBHOOK_SECRET = original;
  });

  it("returns 400 when signature is invalid", async () => {
    mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });
    const req = makeWebhookRequest('{"type":"test"}', "t=123,v1=bad_sig");
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    // Error message must be generic - must NOT leak internal stripe error details
    expect(body.error).toBe("Invalid webhook signature");
  });

  it("returns 200 for valid checkout.session.completed event", async () => {
    const fakeEvent = {
      type: "checkout.session.completed",
      id: "evt_test_1",
      data: {
        object: {
          id: "cs_test_1",
          metadata: { user_id: "user-1", plan_id: "plan_pro" },
          customer: "cus_test_1",
          subscription: "sub_test_1",
          amount_total: 1900,
        },
      },
    };
    mockStripe.webhooks.constructEvent.mockReturnValueOnce(fakeEvent);
    mockDb.userSubscription.upsert.mockResolvedValueOnce({ id: "sub-1" });
    mockDb.activityLog.create.mockResolvedValueOnce({});
    mockDb.user.findUnique.mockResolvedValueOnce({ email: "user@example.com" });
    mockDb.adminNotification.create.mockResolvedValueOnce({});

    const req = makeWebhookRequest(JSON.stringify(fakeEvent), "t=123,v1=valid");
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });

  it("returns 200 for customer.subscription.deleted event (downgrade to free)", async () => {
    const fakeEvent = {
      type: "customer.subscription.deleted",
      id: "evt_test_2",
      data: {
        object: {
          id: "sub_test_2",
          metadata: { user_id: "user-1" },
          status: "canceled",
          canceled_at: Math.floor(Date.now() / 1000),
        },
      },
    };
    mockStripe.webhooks.constructEvent.mockReturnValueOnce(fakeEvent);
    mockDb.userSubscription.updateMany.mockResolvedValueOnce({ count: 1 });
    mockDb.user.findUnique.mockResolvedValueOnce({ email: "user@example.com" });
    mockDb.adminNotification.create.mockResolvedValueOnce({});

    const req = makeWebhookRequest(JSON.stringify(fakeEvent), "t=123,v1=valid");
    const res = await handler(req);
    expect(res.status).toBe(200);
  });

  it("returns 200 for unhandled event types (no-op)", async () => {
    const fakeEvent = {
      type: "payment_intent.created",
      id: "evt_test_3",
      data: { object: {} },
    };
    mockStripe.webhooks.constructEvent.mockReturnValueOnce(fakeEvent);

    const req = makeWebhookRequest(JSON.stringify(fakeEvent), "t=123,v1=valid");
    const res = await handler(req);
    expect(res.status).toBe(200);
  });
});
