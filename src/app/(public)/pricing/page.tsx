// TODO: STRIPE - update with real prices when billing is implemented
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing - OMG Bridge",
  description: "Simple, transparent pricing. Free to start, $199/year for unlimited.",
};

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlight: boolean;
  badge?: string;
}

const plans: Plan[] = [
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
    cta: "Get Started Free",
    href: "/onboarding",
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
    href: "/onboarding",
    highlight: true,
    badge: "BEST VALUE",
  },
];

export default function PricingPage() {
  return (
    <div className="page-shell">
      {/* HERO */}
      <section className="page-hero">
        <div className="page-hero-body">
          <div className="section-eyebrow">
            <span>PRICING</span>
            <span className="rule" />
          </div>
          <h1>
            Simple, <span className="underline">honest</span>{" "}
            <span className="accent">pricing.</span>
          </h1>
          <p className="lede">
            Start free. One flat annual fee when you need unlimited. No seat
            tax. No usage trap. Cancel anytime.
          </p>
        </div>
      </section>

      {/* PLANS */}
      <section className="plans-section">
        <div className="plans-body">
          <div className="plans-grid">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`plan-card${plan.highlight ? " highlight" : ""}`}
              >
                {plan.badge && <div className="plan-badge">{plan.badge}</div>}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">
                  <span className="amount">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>
                <p className="plan-desc">{plan.description}</p>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="check">+</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={plan.highlight ? "btn btn-primary" : "btn"}
                >
                  {plan.cta} →
                </Link>
              </article>
            ))}
          </div>

          <div className="plans-note">
            <div>
              <span className="status-dot" /> ALL PLANS INCLUDE THE SAME 30 MCP
              TOOLS
            </div>
            <div>CANCEL OR DOWNGRADE ANYTIME. NO CONTRACTS.</div>
          </div>
        </div>
      </section>

      <style>{`
        .page-shell { min-height: 100%; }

        /* page hero */
        .page-hero {
          display: block;
          border-bottom: 1px solid var(--rule);
        }
        .page-hero-body { padding: 64px 56px 72px; max-width: 1100px; }
        .page-hero h1 {
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(40px, 5.4vw, 64px);
          line-height: 1.0;
          letter-spacing: -0.035em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .page-hero h1 .accent { color: var(--vermilion); }
        .page-hero h1 .underline {
          text-decoration: underline;
          text-decoration-color: var(--teal);
          text-decoration-thickness: 4px;
          text-underline-offset: 6px;
        }
        .page-hero .lede {
          font-size: 16px;
          line-height: 1.65;
          color: var(--ink-2);
          max-width: 580px;
        }

        /* plans */
        .plans-section {
          display: block;
          border-bottom: 1px solid var(--rule);
        }
        .plans-body { padding: 56px 56px 80px; }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          border: 1px solid var(--rule-strong);
          margin-bottom: 32px;
        }
        .plan-card {
          position: relative;
          padding: 40px 36px;
          background: var(--surface-1);
          border-right: 1px solid var(--rule-strong);
          display: flex;
          flex-direction: column;
        }
        .plan-card:last-child { border-right: none; }
        .plan-card.highlight {
          background: var(--bg);
          box-shadow: inset 4px 0 0 var(--teal);
          padding-left: 40px;
          border-right: 1px solid rgba(0, 181, 181, 0.5);
        }
        .plan-badge {
          position: absolute;
          top: 18px;
          right: 18px;
          padding: 4px 10px;
          background: var(--vermilion);
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .plan-name {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 14px;
          font-weight: 600;
        }
        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 12px;
        }
        .plan-price .amount {
          font-family: var(--display);
          font-weight: 700;
          font-size: 56px;
          line-height: 1;
          letter-spacing: -0.04em;
          color: var(--ink);
          font-variant-numeric: tabular-nums;
        }
        .plan-card.highlight .plan-price .amount { color: var(--teal-bright); }
        .plan-price .period {
          font-size: 14px;
          color: var(--ink-3);
          margin-left: 4px;
        }
        .plan-desc {
          font-size: 13px;
          color: var(--ink-2);
          line-height: 1.6;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--rule);
        }
        .plan-card ul {
          list-style: none;
          padding: 0;
          margin: 0 0 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .plan-card ul li {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: var(--ink-2);
          line-height: 1.5;
        }
        .plan-card ul li .check {
          color: var(--teal-bright);
          font-weight: 700;
          flex-shrink: 0;
        }
        .plan-card .btn { width: 100%; justify-content: center; }

        .plans-note {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid var(--rule);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .plans-note > div { display: inline-flex; align-items: center; gap: 8px; }

        @media (max-width: 980px) {
          .page-hero-body { padding: 40px 20px 48px; }
          .plans-body { padding: 32px 20px 56px; }
          .plans-grid { grid-template-columns: 1fr; }
          .plan-card {
            border-right: none;
            border-bottom: 1px solid var(--rule-strong);
          }
          .plan-card:last-child { border-bottom: none; }
        }
      `}</style>
    </div>
  );
}
