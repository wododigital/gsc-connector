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
    return <div className="p-8 text-zinc-400">Loading billing info...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing &amp; Plans</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your subscription and usage</p>
      </div>

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

      {usage && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Current Plan: {usage.display_name}
              </h2>
              <p className="text-sm text-zinc-400">
                {usage.price_cents > 0
                  ? `$${(usage.price_cents / 100).toFixed(0)}/month`
                  : "Free"}
                {usage.status !== "active" && (
                  <span className="ml-2 text-yellow-400">({usage.status})</span>
                )}
              </p>
            </div>
            {usage.price_cents > 0 && (
              <button
                onClick={handlePortal}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
              >
                Manage Subscription
              </button>
            )}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zinc-400">Tool calls used this period</span>
              <span className="text-white font-medium">
                {usage.calls_used.toLocaleString()} / {usage.calls_limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usage.percentage_used >= 90
                    ? "bg-red-500"
                    : usage.percentage_used >= 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(100, usage.percentage_used)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Resets on {new Date(usage.period_end).toLocaleDateString()} -{" "}
              {usage.calls_remaining.toLocaleString()} calls remaining
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = usage?.plan === plan.name;
            const isUpgrade = (plan.priceCents ?? 0) > (usage?.price_cents ?? 0);
            const isFree = plan.priceCents === 0;

            return (
              <div
                key={plan.id}
                className={`bg-zinc-900 border rounded-lg p-5 ${
                  isCurrentPlan ? "border-blue-500" : "border-zinc-800"
                }`}
              >
                <h3 className="text-lg font-bold text-white">{plan.displayName}</h3>
                <p className="text-2xl font-bold text-white mt-2">
                  {plan.priceCents > 0 ? `$${(plan.priceCents / 100).toFixed(0)}` : "Free"}
                  {plan.priceCents > 0 && (
                    <span className="text-sm text-zinc-400 font-normal">/month</span>
                  )}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  {plan.monthlyCalls.toLocaleString()} tool calls/month
                </p>
                <ul className="mt-4 space-y-2">
                  {(plan.features as string[]).map((feature, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
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
                    <span className="block text-center py-2 text-sm text-zinc-500">
                      Included
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                        isUpgrade
                          ? "bg-blue-600 hover:bg-blue-500 text-white"
                          : "bg-zinc-800 hover:bg-zinc-700 text-white"
                      }`}
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Have a coupon code?</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white
                       placeholder-zinc-500 text-sm w-64 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleCoupon}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
          >
            Apply
          </button>
        </div>
        {couponMessage && (
          <p
            className={`text-sm mt-2 ${
              couponMessage.toLowerCase().includes("applied") ||
              couponMessage.toLowerCase().includes("upgraded")
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {couponMessage}
          </p>
        )}
      </div>

      <div className="text-center text-sm text-zinc-500">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
