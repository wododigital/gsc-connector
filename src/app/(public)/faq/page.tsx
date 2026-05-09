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
        a: "Yes. The Free plan includes 200 tool calls per month and 1 Google account - enough to explore and test the integration.",
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
        a: "Annual is a single $199/year charge that unlocks unlimited tool calls and unlimited connected Google accounts. Cancel anytime - your access continues until the end of the paid period.",
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
    <div className="max-w-3xl mx-auto px-6 py-20">
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
          Support
        </div>
        <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Everything you need to know about OMG Bridge.</p>
      </div>

      <div className="space-y-12">
        {faqs.map((section) => (
          <div key={section.section}>
            <h2
              className="text-lg font-semibold mb-4 pb-2"
              style={{
                color: "var(--text-primary)",
                borderBottom: "1px solid var(--glass-border)",
              }}
            >
              {section.section}
            </h2>
            <div className="space-y-6">
              {section.items.map((item) => (
                <div key={item.q}>
                  <h3 className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{item.q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
