// TODO: STRIPE - update with real prices when billing is implemented

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-950 border border-green-800 text-green-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              Now in beta - free during launch
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-100 mb-6">
              Query Your Search Console Data with{" "}
              <span className="text-green-400">Natural Language</span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 mb-8 leading-relaxed">
              GSC Connect bridges Google Search Console to Claude, ChatGPT, and Cursor
              via the Model Context Protocol. Ask questions about your SEO data in plain
              English - no SQL, no dashboards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/api/auth/google"
                className="px-8 py-3 text-base font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                Connect Your GSC - Free
              </a>
              <a
                href="#how-it-works"
                className="px-8 py-3 text-base font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
              Up and running in 3 steps
            </h2>
            <p className="text-zinc-400 text-lg">
              No complicated setup. Connect once, query forever.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-green-950 border border-green-800 flex items-center justify-center text-green-400 font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Connect Google
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Sign in with your Google account and grant read access to your
                Search Console properties. Your tokens are encrypted at rest.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-green-950 border border-green-800 flex items-center justify-center text-green-400 font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Get your MCP endpoint
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Copy your personal MCP endpoint URL from your dashboard.
                It takes 30 seconds to set up.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-green-950 border border-green-800 flex items-center justify-center text-green-400 font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Ask questions in Claude or ChatGPT
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Paste your endpoint into Claude.ai, Cursor, or Claude Desktop.
                Start asking natural language questions about your SEO data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
              Everything your AI assistant needs
            </h2>
            <p className="text-zinc-400 text-lg">
              13 tools covering every GSC data point.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Multi-property support",
                description:
                  "Connect and query multiple GSC properties at once. Perfect for agencies managing client sites.",
              },
              {
                title: "13 MCP tools",
                description:
                  "Search analytics, top keywords, top pages, URL inspection, sitemap management, and more.",
              },
              {
                title: "Works with Claude.ai",
                description:
                  "Native OAuth2 integration - Claude.ai connects directly. No API keys needed for Claude.",
              },
              {
                title: "Works with Claude Desktop and Cursor",
                description:
                  "Use API key authentication for Claude Desktop and Cursor MCP integrations.",
              },
              {
                title: "End-to-end encrypted",
                description:
                  "Your Google refresh tokens are encrypted with AES-256-GCM. Keys never leave your account.",
              },
              {
                title: "Rate limit aware",
                description:
                  "Built-in rate limiting per user and per tier. Your quota is always respected.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <div className="w-8 h-8 rounded-md bg-green-950 border border-green-800 flex items-center justify-center mb-4">
                  <span className="text-green-400 text-sm font-bold">+</span>
                </div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {/* TODO: STRIPE - update with real prices when billing is implemented */}
      <section id="pricing" className="py-20 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-zinc-400 text-lg">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-100 mb-1">Free</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-zinc-100">$0</span>
                <span className="text-zinc-400 text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  "1 GSC property",
                  "100 queries/day",
                  "All 13 MCP tools",
                  "Claude.ai + Claude Desktop",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-green-400 shrink-0">+</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="/api/auth/google"
                className="block w-full text-center px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium transition-colors"
              >
                Get started free
              </a>
            </div>

            {/* Pro Tier */}
            <div className="p-6 rounded-xl bg-zinc-900 border border-green-700 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-green-600 text-white text-xs font-medium">
                Most popular
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-1">Pro</h3>
              <div className="mb-4">
                {/* TODO: STRIPE - set real price */}
                <span className="text-3xl font-bold text-zinc-100">$X</span>
                <span className="text-zinc-400 text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  "Up to 10 GSC properties",
                  "10,000 queries/day",
                  "All 13 MCP tools",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-green-400 shrink-0">+</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="/api/auth/google"
                className="block w-full text-center px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
              >
                Start with Pro
              </a>
            </div>

            {/* Agency Tier */}
            <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-100 mb-1">Agency</h3>
              <div className="mb-4">
                {/* TODO: STRIPE - set real price */}
                <span className="text-3xl font-bold text-zinc-100">$X</span>
                <span className="text-zinc-400 text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  "Up to 100 GSC properties",
                  "100,000 queries/day",
                  "All 13 MCP tools",
                  "Client property management",
                  "Dedicated support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-green-400 shrink-0">+</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="/api/auth/google"
                className="block w-full text-center px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium transition-colors"
              >
                Start with Agency
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-zinc-400 text-sm font-semibold text-green-400">
              GSC Connect
            </span>
            <p className="text-zinc-500 text-sm">
              &copy; {new Date().getFullYear()} WODO Digital. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-zinc-500">
              <span>Built with MCP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
