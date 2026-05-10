import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - OMG Bridge",
  description: "Frequently asked questions about OMG Bridge.",
};

const faqs = [
  {
    section: "Getting Started",
    items: [
      {
        q: "What is OMG Bridge?",
        a: "OMG Bridge is a SaaS tool that connects your Google Search Console, Google Analytics 4, and Google Business Profile data to AI assistants like Claude, ChatGPT, and Cursor via the Model Context Protocol (MCP). It lets your AI tools query your SEO and analytics data directly.",
      },
      {
        q: "How does it work?",
        a: "After signing in with Google and connecting your GSC, GA4, and GBP properties, OMG Bridge gives you an MCP endpoint URL. Paste that URL into your AI tool's settings and it gains access to 30 tools covering search analytics, sitemaps, URL inspection, traffic data, reviews, and more.",
      },
      {
        q: "Which AI tools are supported?",
        a: "Claude.ai and ChatGPT (via OAuth), and Claude Desktop, Cursor, and any MCP-compatible client (via API key).",
      },
      {
        q: "Do I need technical knowledge to use OMG Bridge?",
        a: "No. If you can paste a URL into a settings field, you can set up OMG Bridge. The guides page has step-by-step instructions for each supported AI tool.",
      },
    ],
  },
  {
    section: "Security and Privacy",
    items: [
      {
        q: "How are my Google credentials stored?",
        a: "Your Google OAuth refresh tokens are encrypted at rest using AES-256-GCM before being stored in our database. We never store your Google password.",
      },
      {
        q: "What Google permissions does OMG Bridge need?",
        a: "We request read-only access to Google Search Console (webmasters.readonly), Google Analytics 4 (analytics.readonly), and Google Business Profile (business.manage). We never request write access to your search data.",
      },
      {
        q: "Can I revoke access?",
        a: "Yes. You can disconnect your Google account from the OMG Bridge dashboard at any time. You can also revoke access directly from your Google account's security settings.",
      },
      {
        q: "Is my data shared with anyone?",
        a: "No. Your Google data is only used to respond to tool calls from your authorized AI sessions. It is never sold or shared with third parties.",
      },
    ],
  },
  {
    section: "Pricing and Billing",
    items: [
      {
        q: "Is there a free plan?",
        a: "Yes. The Free plan includes 200 tool calls per month and 1 Google account. Enough to explore and test the integration.",
      },
      {
        q: "What counts as a tool call?",
        a: "Each time your AI assistant calls one of the 30 MCP tools (e.g. get_search_analytics, ga4_run_report, gbp_get_reviews) counts as one tool call.",
      },
      {
        q: "What happens when I hit my monthly limit?",
        a: "Tool calls are blocked until your billing period resets (every 30 days). Upgrade to Annual ($199/year) at any time for unlimited tool calls.",
      },
      {
        q: "How does Annual billing work?",
        a: "Annual is a single $199/year charge that unlocks unlimited tool calls and unlimited connected Google accounts. Cancel anytime. Your access continues until the end of the paid period.",
      },
      {
        q: "Do you offer refunds?",
        a: "Contact support within 7 days of a charge if you are not satisfied and we will issue a full refund.",
      },
    ],
  },
  {
    section: "Troubleshooting",
    items: [
      {
        q: "My AI tool says 'no active GSC property found'",
        a: "Go to your OMG Bridge dashboard and make sure at least one property is toggled on in the property list. Properties must be explicitly activated before they can be used.",
      },
      {
        q: "I get authentication errors when using Claude Desktop",
        a: "Make sure you are using your API key (from the API Keys page) as the Bearer token in your Claude Desktop config. OAuth tokens from Claude.ai cannot be reused in Claude Desktop.",
      },
      {
        q: "My data seems outdated",
        a: "Google Search Console data has a 2-4 day lag inherent to the API. This is a Google limitation, not an OMG Bridge issue.",
      },
      {
        q: "How do I report a bug or request a feature?",
        a: "Open a support ticket from your dashboard. We aim to respond within 24 hours.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="page-shell">
      {/* HERO */}
      <section className="page-hero">
        <div className="page-hero-body">
          <div className="section-eyebrow">
            <span className="num">01</span>
            <span>SUPPORT</span>
            <span className="rule" />
          </div>
          <h1>
            Frequently asked
            <br />
            <span className="accent">questions.</span>
          </h1>
          <p className="lede">
            Everything you need to know about OMG Bridge. Connecting Google,
            wiring up AI tools, security, billing.
          </p>
        </div>
      </section>

      {/* FAQ SECTIONS */}
      {faqs.map((section, idx) => (
        <section key={section.section} className="faq-section">
          <div className="faq-body">
            <div className="section-eyebrow">
              <span className="num">{String(idx + 2).padStart(2, "0")}</span>
              <span>{section.section.toUpperCase()}</span>
              <span className="rule" />
            </div>
            <div className="faq-list">
              {section.items.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary>
                    <span className="q-text">{item.q}</span>
                    <span className="q-icon" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <div className="a-text">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      ))}

      <style>{`
        .page-shell { min-height: 100%; }

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
        .page-hero .lede {
          font-size: 16px;
          line-height: 1.65;
          color: var(--ink-2);
          max-width: 580px;
        }

        .faq-section {
          display: block;
          border-bottom: 1px solid var(--rule);
        }
        .faq-body { padding: 56px 56px 72px; max-width: 920px; }

        .faq-list {
          border-top: 1px solid var(--rule-strong);
        }
        .faq-item {
          border-bottom: 1px solid var(--rule-strong);
        }
        .faq-item summary {
          list-style: none;
          cursor: pointer;
          padding: 22px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          transition: color 0.18s ease;
        }
        .faq-item summary::-webkit-details-marker { display: none; }
        .faq-item summary:hover { color: var(--teal-bright); }
        .faq-item summary .q-text {
          font-family: var(--display);
          font-weight: 600;
          font-size: 18px;
          letter-spacing: -0.015em;
          color: var(--ink);
        }
        .faq-item summary .q-icon {
          color: var(--teal);
          font-size: 22px;
          line-height: 1;
          font-weight: 400;
          font-family: var(--body);
          transition: transform 0.2s ease, color 0.18s ease;
        }
        .faq-item[open] summary .q-icon {
          transform: rotate(45deg);
          color: var(--vermilion);
        }
        .faq-item .a-text {
          padding: 0 0 24px;
          font-size: 14px;
          color: var(--ink-2);
          line-height: 1.7;
          max-width: 720px;
        }

        @media (max-width: 980px) {
          .page-hero-body { padding: 40px 20px 48px; }
          .faq-body { padding: 32px 20px 56px; }
          .faq-item summary .q-text { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}
