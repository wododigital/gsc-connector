import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing - OMG AI",
  description: "Simple, transparent pricing. Start free, upgrade when you need more.",
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Perfect for testing and personal projects.",
    features: [
      "1 Google account",
      "100 tool calls/month",
      "GSC + GA4 access",
      "All 23 MCP tools",
      "Claude.ai, Desktop, Cursor support",
      "Community support",
    ],
    cta: "Get started free",
    href: "/dashboard",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    description: "For professionals and growing sites.",
    features: [
      "3 Google accounts",
      "1,000 tool calls/month",
      "GSC + GA4 access",
      "All 23 MCP tools",
      "All AI tool integrations",
      "Priority support",
      "Usage analytics",
    ],
    cta: "Start Pro",
    href: "/dashboard/billing",
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 49,
    description: "For agencies and power users.",
    features: [
      "10 Google accounts",
      "5,000 tool calls/month",
      "GSC + GA4 access",
      "All 23 MCP tools",
      "All AI tool integrations",
      "Priority support",
      "Usage analytics",
      "Early access to new features",
    ],
    cta: "Start Premium",
    href: "/dashboard/billing",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Simple, transparent pricing</h1>
        <p className="text-zinc-400 text-lg">Start free. Upgrade when you need more.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl p-6 border flex flex-col ${
              plan.highlight
                ? "bg-blue-950/40 border-blue-600 relative"
                : "bg-zinc-900 border-zinc-800"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most popular</span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-white">{plan.name}</h2>
              <p className="text-zinc-500 text-sm mt-1 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                </span>
                {plan.price > 0 && <span className="text-zinc-400 text-sm">/month</span>}
              </div>
              <ul className="space-y-2 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto">
              <Link
                href={plan.href}
                className={`block text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  plan.highlight
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-zinc-500">
        <p>All plans include GSC + GA4 integration, 23 MCP tools, and the same core features.</p>
        <p className="mt-1">Upgrade or cancel anytime. No contracts.</p>
      </div>
    </div>
  );
}
