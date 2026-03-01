import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - OMG AI",
  description: "Frequently asked questions about OMG AI GSC Connect.",
};

const faqs = [
  {
    section: "Getting Started",
    items: [
      {
        q: "What is OMG AI?",
        a: "OMG AI is a SaaS tool that connects your Google Search Console and Google Analytics 4 data to AI assistants like Claude, ChatGPT, and Cursor via the Model Context Protocol (MCP). It lets your AI tools query your SEO and analytics data directly.",
      },
      {
        q: "How does it work?",
        a: "After signing in with Google and connecting your GSC/GA4 properties, OMG AI gives you an MCP endpoint URL. Paste that URL into your AI tool's settings and it gains access to 23 SEO tools covering search analytics, sitemaps, URL inspection, traffic data, and more.",
      },
      {
        q: "Which AI tools are supported?",
        a: "Claude.ai (via OAuth), Claude Desktop (via API key), and Cursor (via API key). ChatGPT support via OpenAPI is coming soon.",
      },
      {
        q: "Do I need technical knowledge to use OMG AI?",
        a: "No. If you can paste a URL into a settings field, you can set up OMG AI. The guides page has step-by-step instructions for each supported AI tool.",
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
        q: "What Google permissions does OMG AI need?",
        a: "We request read-only access to Google Search Console (webmasters.readonly) and Google Analytics 4 (analytics.readonly). We never request write access.",
      },
      {
        q: "Can I revoke access?",
        a: "Yes. You can disconnect your Google account from the OMG AI dashboard at any time. You can also revoke access directly from your Google account's security settings.",
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
        a: "Yes. The Free plan includes 100 tool calls per month and 1 Google account - enough to explore and test the integration.",
      },
      {
        q: "What counts as a tool call?",
        a: "Each time your AI assistant calls one of the 23 MCP tools (e.g. get_search_analytics, ga_run_report) counts as one tool call.",
      },
      {
        q: "What happens when I hit my monthly limit?",
        a: "Tool calls are blocked until your billing period resets (every 30 days). You can upgrade your plan at any time to increase your limit immediately.",
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
        a: "Go to your OMG AI dashboard and make sure at least one property is toggled on in the property list. Properties must be explicitly activated before they can be used.",
      },
      {
        q: "I get authentication errors when using Claude Desktop",
        a: "Make sure you are using your API key (from the API Keys page) as the Bearer token in your Claude Desktop config. OAuth tokens from Claude.ai cannot be reused in Claude Desktop.",
      },
      {
        q: "My data seems outdated",
        a: "Google Search Console data has a 2-4 day lag inherent to the API. This is a Google limitation, not an OMG AI issue.",
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
        <h1 className="text-4xl font-bold text-white mb-3">Frequently Asked Questions</h1>
        <p className="text-zinc-400">Everything you need to know about OMG AI.</p>
      </div>

      <div className="space-y-12">
        {faqs.map((section) => (
          <div key={section.section}>
            <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-zinc-800">{section.section}</h2>
            <div className="space-y-6">
              {section.items.map((item) => (
                <div key={item.q}>
                  <h3 className="text-white font-medium mb-1">{item.q}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
