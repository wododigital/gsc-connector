"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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
  displayName: string;
  monthlyCalls: number;
  priceCents: number;
  features: string[];
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");

  useEffect(() => {
    Promise.all([
      fetch("/api/usage").then((r) => r.json()),
      fetch("/api/plans").then((r) => r.json()),
    ]).then(([usageData, plansData]) => {
      setUsage(usageData);
      setPlans(plansData.plans ?? []);
      setLoading(false);
    });
  }, []);

  const handleCheckout = async (planId: string) => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? "Failed to start checkout");
    }
  };

  const handlePortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? "Failed to open billing portal");
    }
  };

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await fetch("/api/coupons/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode }),
    });
    const data = await res.json();
    setCouponMessage(data.message ?? data.error ?? "");
    if (data.success) {
      setCouponCode("");
      const updated = await fetch("/api/usage").then((r) => r.json());
      setUsage(updated);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-sm" style={{ color: "var(--text-secondary)" }}>
        Loading billing info...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="page-title">Billing &amp; Plans</h1>
        <p className="page-subtitle">Manage your subscription and usage</p>
      </div>

      {success && (
        <div className="glass-card p-4" style={{ borderColor: "var(--success)", color: "var(--success)" }}>
          <p className="text-sm">Payment successful! Your plan has been upgraded. Welcome aboard!</p>
        </div>
      )}
      {cancelled && (
        <div className="glass-card p-4" style={{ borderColor: "var(--warning)", color: "var(--warning)" }}>
          <p className="text-sm">Checkout was cancelled. No charges were made.</p>
        </div>
      )}

      {usage && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Current Plan: {usage.display_name}
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {usage.price_cents > 0
                  ? `$${(usage.price_cents / 100).toFixed(0)}/month`
                  : "Free"}
                {usage.status !== "active" && (
                  <span className="ml-2" style={{ color: "var(--warning)" }}>({usage.status})</span>
                )}
              </p>
            </div>
            {usage.price_cents > 0 && (
              <button onClick={handlePortal} className="btn-ghost btn-ghost-sm">
                Manage Subscription
              </button>
            )}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: "var(--text-secondary)" }}>Tool calls used this period</span>
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                {usage.calls_used.toLocaleString()} / {usage.calls_limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, usage.percentage_used)}%`,
                  background: usage.percentage_used >= 90
                    ? "var(--error)"
                    : usage.percentage_used >= 70
                    ? "var(--warning)"
                    : "var(--accent)",
                }}
              />
            </div>
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
              Resets on {new Date(usage.period_end).toLocaleDateString()} -{" "}
              {usage.calls_remaining.toLocaleString()} calls remaining
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Available Plans
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = usage?.plan === plan.name;
            const isUpgrade = (plan.priceCents ?? 0) > (usage?.price_cents ?? 0);
            const isFree = plan.priceCents === 0;

            return (
              <div
                key={plan.id}
                className="glass-card p-5"
                style={isCurrentPlan ? { borderColor: "var(--glass-border-accent)" } : {}}
              >
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {plan.displayName}
                </h3>
                <p className="text-2xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>
                  {plan.priceCents > 0 ? `$${(plan.priceCents / 100).toFixed(0)}` : "Free"}
                  {plan.priceCents > 0 && (
                    <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>/month</span>
                  )}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {plan.monthlyCalls.toLocaleString()} tool calls/month
                </p>
                <ul className="mt-4 space-y-2">
                  {(plan.features as string[]).map((feature, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)", marginTop: "2px" }}>&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {isCurrentPlan ? (
                    <span className="block text-center py-2 text-sm font-medium" style={{ color: "var(--accent-light)" }}>
                      Current Plan
                    </span>
                  ) : isFree ? (
                    <span className="block text-center py-2 text-sm" style={{ color: "var(--text-muted)" }}>
                      Included
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      className={`w-full ${isUpgrade ? "btn-primary btn-primary-sm" : "btn-ghost btn-ghost-sm"}`}
                    >
                      {isUpgrade ? "Upgrade" : "Switch Plan"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Have a coupon code?
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="glass-input text-sm"
            style={{ maxWidth: "240px" }}
          />
          <button onClick={handleCoupon} className="btn-primary btn-primary-sm">
            Apply
          </button>
        </div>
        {couponMessage && (
          <p
            className="text-sm mt-2"
            style={{
              color:
                couponMessage.toLowerCase().includes("applied") ||
                couponMessage.toLowerCase().includes("upgraded")
                  ? "var(--success)"
                  : "var(--error)",
            }}
          >
            {couponMessage}
          </p>
        )}
      </div>

      <div className="text-center text-sm">
        <Link href="/dashboard" style={{ color: "var(--text-secondary)" }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
