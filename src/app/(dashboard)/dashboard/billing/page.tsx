"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Failed to start checkout");
  };

  const handlePortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Failed to open billing portal");
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
      <div style={{ padding: 36, color: "var(--ink-3)", fontSize: 13 }}>
        Loading billing info...
      </div>
    );
  }

  return (
    <>
      <style>{BILLING_CSS}</style>
      <div className="page-header">
        <div>
          <h1>Billing &amp; <span className="accent">plan.</span></h1>
          <p className="lede">Manage your subscription, monitor usage, and switch plans.</p>
        </div>
      </div>

      {success && (
        <div className="billing-callout success">
          Payment successful. Your plan has been upgraded.
        </div>
      )}
      {cancelled && (
        <div className="billing-callout warn">
          Checkout was cancelled. No charges were made.
        </div>
      )}

      {usage && (
        <div className="billing-card">
          <div className="billing-card-head">
            <div>
              <div className="eyebrow-mini">CURRENT PLAN</div>
              <h2>{usage.display_name}</h2>
              <p className="billing-price">
                {usage.price_cents > 0
                  ? usage.plan === "annual"
                    ? `$${(usage.price_cents / 100).toFixed(0)}/year`
                    : `$${(usage.price_cents / 100).toFixed(0)}/month`
                  : "Free"}
                {usage.status !== "active" && (
                  <span style={{ color: "var(--amber)", marginLeft: 10, fontSize: 11 }}>
                    ({usage.status.toUpperCase()})
                  </span>
                )}
              </p>
            </div>
            {usage.price_cents > 0 && (
              <button onClick={handlePortal} className="btn">MANAGE SUBSCRIPTION</button>
            )}
          </div>

          <div className="billing-meter">
            <div className="billing-meter-row">
              <span>TOOL CALLS USED THIS PERIOD</span>
              <strong>
                {usage.calls_limit >= 999999
                  ? `${usage.calls_used.toLocaleString()} / Unlimited`
                  : `${usage.calls_used.toLocaleString()} / ${usage.calls_limit.toLocaleString()}`}
              </strong>
            </div>
            {usage.calls_limit < 999999 && (
              <div className="billing-bar">
                <div
                  className="billing-bar-fill"
                  style={{
                    width: `${Math.min(100, usage.percentage_used)}%`,
                    background:
                      usage.percentage_used >= 90 ? "var(--vermilion)"
                        : usage.percentage_used >= 70 ? "var(--amber)"
                        : "var(--teal)",
                  }}
                />
              </div>
            )}
            <p className="billing-meter-note">
              {usage.calls_limit >= 999999
                ? "Unlimited tool calls included with Annual."
                : `Resets on ${new Date(usage.period_end).toLocaleDateString()} - ${usage.calls_remaining.toLocaleString()} calls remaining`}
            </p>
          </div>
        </div>
      )}

      <div className="section-header">
        <h2>Available Plans</h2>
      </div>
      <div className="billing-plans">
        {plans.map((plan) => {
          const isCurrentPlan = usage?.plan === plan.name;
          const isUpgrade = (plan.priceCents ?? 0) > (usage?.price_cents ?? 0);
          const isFree = plan.priceCents === 0;
          const isAnnual = plan.name === "annual";
          const isUnlimited = plan.monthlyCalls >= 999999;
          return (
            <div
              key={plan.id}
              className={`billing-plan${isCurrentPlan ? " current" : ""}`}
            >
              <h3>{plan.displayName}</h3>
              <p className="billing-plan-price">
                {plan.priceCents > 0 ? `$${(plan.priceCents / 100).toFixed(0)}` : "Free"}
                {plan.priceCents > 0 && (
                  <span className="billing-plan-cycle">{isAnnual ? "/year" : "/month"}</span>
                )}
              </p>
              <p className="billing-plan-calls">
                {isUnlimited ? "Unlimited tool calls" : `${plan.monthlyCalls.toLocaleString()} tool calls/month`}
              </p>
              <ul className="billing-plan-features">
                {plan.features.map((f, i) => (
                  <li key={i}>
                    <span style={{ color: "var(--teal)" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <div className="billing-plan-cta">
                {isCurrentPlan ? (
                  <span className="pill info" style={{ width: "100%", justifyContent: "center", padding: "8px 12px" }}>
                    CURRENT PLAN
                  </span>
                ) : isFree ? (
                  <span className="pill" style={{ width: "100%", justifyContent: "center", padding: "8px 12px" }}>
                    INCLUDED
                  </span>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    className={isUpgrade ? "btn btn-primary" : "btn"}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {isUpgrade ? "UPGRADE" : "SWITCH PLAN"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-header">
        <h2>Coupon Code</h2>
      </div>
      <div className="billing-card billing-coupon">
        <p className="billing-card-sub">Have a coupon? Apply it here.</p>
        <div className="billing-coupon-row">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            className="input-field"
            style={{ maxWidth: 240 }}
          />
          <button onClick={handleCoupon} className="btn btn-primary">APPLY</button>
        </div>
        {couponMessage && (
          <p
            style={{
              marginTop: 10, fontSize: 12,
              color: couponMessage.toLowerCase().includes("applied") || couponMessage.toLowerCase().includes("upgraded")
                ? "var(--green)" : "var(--vermilion)",
            }}
          >
            {couponMessage}
          </p>
        )}
      </div>
    </>
  );
}

const BILLING_CSS = `
.billing-callout {
  padding: 14px 18px;
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  margin-bottom: 18px;
  font-size: 12.5px;
  color: var(--ink-2);
}
.billing-callout.success { border-left: 3px solid var(--green); color: var(--green); }
.billing-callout.warn { border-left: 3px solid var(--amber); color: var(--amber); }

.billing-card {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 24px;
  margin-bottom: 18px;
}
.billing-card-head {
  display: flex; justify-content: space-between; align-items: start; gap: 16px;
  margin-bottom: 20px; flex-wrap: wrap;
}
.eyebrow-mini {
  font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--ink-3);
  margin-bottom: 6px;
}
.billing-card h2 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 24px;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--ink);
}
.billing-price {
  margin-top: 4px;
  font-size: 13px;
  color: var(--ink-2);
}
.billing-card-sub {
  font-size: 12px; color: var(--ink-3);
  margin-bottom: 12px;
}

.billing-meter-row {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--ink-3);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.billing-meter-row strong {
  color: var(--ink); font-family: var(--mono);
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}
.billing-bar {
  height: 6px;
  background: var(--surface-3);
  overflow: hidden;
}
.billing-bar-fill { height: 100%; transition: width .3s; }
.billing-meter-note {
  margin-top: 8px;
  font-size: 11px; color: var(--ink-3);
}

.billing-plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.billing-plan {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 22px;
  display: flex; flex-direction: column;
}
.billing-plan.current { border-color: var(--card-rule); box-shadow: 0 0 0 1px var(--teal-glow); }
.billing-plan h3 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--ink);
}
.billing-plan-price {
  font-family: var(--display);
  font-weight: 700;
  font-size: 36px;
  color: var(--ink);
  margin-top: 8px; line-height: 1;
}
.billing-plan-cycle {
  font-size: 12px;
  color: var(--ink-3);
  font-weight: 400;
  margin-left: 4px;
}
.billing-plan-calls {
  margin-top: 6px;
  font-size: 12px;
  color: var(--ink-2);
}
.billing-plan-features {
  list-style: none;
  margin: 14px 0;
  padding: 0;
  display: flex; flex-direction: column; gap: 6px;
}
.billing-plan-features li {
  font-size: 12.5px;
  color: var(--ink-2);
}
.billing-plan-cta { margin-top: auto; padding-top: 14px; }

.billing-coupon-row {
  display: flex; gap: 10px; align-items: stretch;
}
`;
