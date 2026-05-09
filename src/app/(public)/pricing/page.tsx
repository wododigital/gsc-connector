import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing - OMG Bridge",
  description: "Simple, transparent pricing. Free to start, $199/year for unlimited.",
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/forever",
    description: "For individuals getting started.",
    features: [
      "1 Google account",
      "200 tool calls/month",
      "All 30 MCP tools",
      "GSC + GA4 + GBP access",
      "Claude.ai, Desktop, Cursor support",
      "Community support",
    ],
    cta: "Get started free",
    href: "/api/auth/google",
    highlight: false,
  },
  {
    id: "annual",
    name: "Annual",
    price: "$199",
    period: "/year",
    description: "For SEOs and agencies who want unlimited access.",
    features: [
      "Unlimited Google accounts",
      "Unlimited tool calls",
      "All 30 MCP tools",
      "GSC + GA4 + GBP access",
      "All AI tool integrations",
      "Priority support",
      "Usage analytics",
    ],
    cta: "Get Annual",
    href: "/dashboard/billing",
    highlight: true,
    badge: "Best value",
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--accent-light)",
            marginBottom: 12,
          }}
        >
          Pricing
        </div>
        <h1
          className="text-4xl font-bold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Simple, transparent pricing
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
          Start free. One flat annual fee when you need unlimited.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          maxWidth: 720,
          margin: "0 auto 48px",
        }}
      >
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card${plan.highlight ? " pricing-card-featured" : ""}`}
            style={{ position: "relative", display: "flex", flexDirection: "column" }}
          >
            {plan.badge && (
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "4px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: 11,
                  fontWeight: 600,
                  background: "linear-gradient(135deg, var(--accent), var(--accent-dim))",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.03em",
                }}
              >
                {plan.badge}
              </div>
            )}
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: 12,
              }}
            >
              {plan.name}
            </p>
            <div style={{ marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                {plan.price}
              </span>
              <span style={{ fontSize: 14, color: "var(--text-muted)", marginLeft: 4 }}>
                {plan.period}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.5 }}>
              {plan.description}
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 28px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                flex: 1,
              }}
            >
              {plan.features.map((f) => (
                <li
                  key={f}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14 }}
                >
                  <span
                    style={{
                      color: "var(--accent-light)",
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={plan.highlight ? "btn-primary" : "btn-ghost"}
              style={{ width: "100%", justifyContent: "center", fontSize: 14 }}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
        <p>All plans include GSC + GA4 + GBP integration and all 30 MCP tools.</p>
        <p className="mt-1">Cancel or downgrade anytime. No contracts.</p>
      </div>
    </div>
  );
}
