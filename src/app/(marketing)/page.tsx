// TODO: STRIPE - update with real prices when billing is implemented

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(0,179,179,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(99,102,241,0.04) 0%, transparent 60%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
              style={{
                background: "rgba(0,179,179,0.08)",
                border: "1px solid rgba(0,179,179,0.2)",
                color: "var(--accent-light)",
              }}
            >
              <span className="status-dot status-dot-success"></span>
              Now in beta - free during launch
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Query Your Search Console Data with{" "}
              <span style={{ color: "var(--accent-light)" }}>Natural Language</span>
            </h1>
            <p className="text-lg sm:text-xl mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              OMG AI bridges Google Search Console and Google Analytics to Claude, ChatGPT, and Cursor
              via the Model Context Protocol. Ask questions about your SEO data in plain
              English - no SQL, no dashboards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/auth/google" className="btn-primary" style={{ fontSize: "15px", padding: "12px 28px" }}>
                Connect Your GSC - Free
              </a>
              <a href="#how-it-works" className="btn-ghost" style={{ fontSize: "15px", padding: "12px 28px" }}>
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20" style={{ borderTop: "1px solid var(--glass-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Up and running in 3 steps
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              No complicated setup. Connect once, query forever.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Connect Google",
                desc: "Sign in with your Google account and grant read access to your Search Console properties. Your tokens are encrypted at rest.",
              },
              {
                step: "2",
                title: "Get your MCP endpoint",
                desc: "Copy your personal MCP endpoint URL from your dashboard. It takes 30 seconds to set up.",
              },
              {
                step: "3",
                title: "Ask questions in Claude or ChatGPT",
                desc: "Paste your endpoint into Claude.ai, Cursor, or Claude Desktop. Start asking natural language questions about your SEO data.",
              },
            ].map((s) => (
              <div key={s.step} className="glass-card flex flex-col items-center text-center p-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4"
                  style={{
                    background: "rgba(0,179,179,0.08)",
                    border: "1px solid rgba(0,179,179,0.25)",
                    color: "var(--accent-light)",
                  }}
                >
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20" style={{ borderTop: "1px solid var(--glass-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Everything your AI assistant needs
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
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
              <div key={feature.title} className="glass-card p-6">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center mb-4"
                  style={{
                    background: "rgba(0,179,179,0.08)",
                    border: "1px solid rgba(0,179,179,0.2)",
                  }}
                >
                  <span style={{ color: "var(--accent-light)", fontSize: "14px", fontWeight: 700 }}>+</span>
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {/* TODO: STRIPE - update with real prices when billing is implemented */}
      <section id="pricing" className="py-20" style={{ borderTop: "1px solid var(--glass-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Simple, transparent pricing
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Free</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>$0</span>
                <span className="text-sm ml-1" style={{ color: "var(--text-secondary)" }}>/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {["1 GSC property", "100 queries/day", "All 13 MCP tools", "Claude.ai + Claude Desktop"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--accent-light)", flexShrink: 0 }}>+</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/api/auth/google" className="btn-ghost block w-full text-center">
                Get started free
              </a>
            </div>

            {/* Pro Tier - accent card */}
            <div className="glass-card-accent p-6 relative">
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-xs font-medium"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-dim))" }}
              >
                Most popular
              </div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Pro</h3>
              <div className="mb-4">
                {/* TODO: STRIPE - set real price */}
                <span className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>$X</span>
                <span className="text-sm ml-1" style={{ color: "var(--text-secondary)" }}>/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {["Up to 10 GSC properties", "10,000 queries/day", "All 13 MCP tools", "Priority support"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--accent-light)", flexShrink: 0 }}>+</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/api/auth/google" className="btn-primary block w-full text-center">
                Start with Pro
              </a>
            </div>

            {/* Agency Tier */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Agency</h3>
              <div className="mb-4">
                {/* TODO: STRIPE - set real price */}
                <span className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>$X</span>
                <span className="text-sm ml-1" style={{ color: "var(--text-secondary)" }}>/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  "Up to 100 GSC properties",
                  "100,000 queries/day",
                  "All 13 MCP tools",
                  "Client property management",
                  "Dedicated support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--accent-light)", flexShrink: 0 }}>+</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/api/auth/google" className="btn-ghost block w-full text-center">
                Start with Agency
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ borderTop: "1px solid var(--glass-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <img
              src="/OMG Rectangle LOGO Dark BG.svg"
              alt="OMG AI"
              className="h-6 w-auto opacity-70"
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              &copy; {new Date().getFullYear()} OMG AI. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
              <span>Built with MCP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
