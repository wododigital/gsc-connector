// TODO: STRIPE - update with real prices when billing is implemented
"use client";

import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Search,
  BarChart3,
  Globe,
  FileSearch,
  Smartphone,
  ShieldCheck,
  Zap,
  Users,
  Check,
  TrendingUp,
  Activity,
  Key,
  MessageSquare,
  Layers,
  Lock,
  Map,
  FileText,
  Rss,
  Star,
  Image,
  MapPin,
  MousePointer,
  Eye,
  Timer,
  Target,
  LineChart,
  PlusCircle,
  Trash2,
  Link2,
  List,
  ChevronRight,
} from "lucide-react";

/* ----------------------------------------------------------------
   Scroll Reveal Hook + Wrapper
   ---------------------------------------------------------------- */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

// Wrapper so hooks can be called at the top level inside .map()
function Reveal({
  children,
  delay = 0,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}s`, ...style }}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------
   Product Preview Card (hero visual)
   ---------------------------------------------------------------- */
function ChatPreviewCard() {
  return (
    <div className="chat-preview">
      {/* Window chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(6,10,16,0.5)",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57", display: "block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E", display: "block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840", display: "block" }} />
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-muted)",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          Claude.ai
        </span>
      </div>

      {/* Chat body */}
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* User message */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px 12px 2px 12px",
              padding: "10px 14px",
              maxWidth: "85%",
              fontSize: 13,
              color: "var(--text-primary)",
              lineHeight: 1.5,
            }}
          >
            What are my top 5 pages by clicks this week?
          </div>
        </div>

        {/* AI response */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(0,179,179,0.15)",
              border: "1px solid rgba(0,179,179,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img src="/OMG Icon SVG.svg" alt="OMG AI" style={{ width: 16, height: 16 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
              Here are your top pages by clicks this week:
            </p>
            {/* Data table */}
            <div
              style={{
                background: "rgba(6,10,16,0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                overflow: "hidden",
                fontSize: 12,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: "0 16px",
                  padding: "7px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: 10,
                }}
              >
                <span>Page</span>
                <span>Clicks</span>
                <span style={{ color: "var(--success)" }}>Change</span>
              </div>
              {[
                { page: "/blog/seo-guide", clicks: "1,247", change: "+18%" },
                { page: "/pricing", clicks: "891", change: "+6%" },
                { page: "/about", clicks: "634", change: "-3%" },
                { page: "/blog/keywords", clicks: "521", change: "+31%" },
                { page: "/contact", clicks: "387", change: "+2%" },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: "0 16px",
                    padding: "8px 12px",
                    borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.page}
                  </span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{row.clicks}</span>
                  <span
                    style={{
                      color: row.change.startsWith("-") ? "var(--error)" : "var(--success)",
                      fontWeight: 500,
                    }}
                  >
                    {row.change}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.5 }}>
              Total: 3,680 clicks this week - up 11% vs previous week.
              <span className="cursor-blink" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Integrations strip
   ---------------------------------------------------------------- */
const integrations = [
  { name: "Claude.ai", desc: "Native OAuth2" },
  { name: "Claude Desktop", desc: "API Key" },
  { name: "ChatGPT", desc: "OAuth2" },
  { name: "Cursor", desc: "API Key" },
  { name: "Google Search Console", desc: "Data source" },
  { name: "Google Analytics 4", desc: "Data source" },
  { name: "Google Business Profile", desc: "Data source" },
];

function IntegrationsBar() {
  return (
    <Reveal
      style={{
        borderTop: "1px solid var(--glass-border)",
        borderBottom: "1px solid var(--glass-border)",
        padding: "20px 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 80,
          background: "linear-gradient(to right, var(--bg-deepest), transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 80,
          background: "linear-gradient(to left, var(--bg-deepest), transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <div className="marquee-track">
        {[...integrations, ...integrations].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 40px",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              {item.name}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.desc}</span>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

/* ----------------------------------------------------------------
   How It Works
   ---------------------------------------------------------------- */
const steps = [
  {
    num: "01",
    icon: ShieldCheck,
    title: "Connect Google",
    desc: "Sign in with your Google account. Grant read access to Search Console, Analytics 4, and Business Profile. Your tokens are AES-256 encrypted at rest.",
  },
  {
    num: "02",
    icon: Link2,
    title: "Copy your MCP endpoint",
    desc: "Get your personal MCP endpoint URL from your dashboard. One URL works with Claude.ai via OAuth, and Claude Desktop or Cursor via API key.",
  },
  {
    num: "03",
    icon: MessageSquare,
    title: "Ask in plain English",
    desc: "Paste the endpoint into your AI tool and start asking questions. No SQL, no dashboards - just natural language over your real data.",
  },
];

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      style={{ padding: "96px 0", borderTop: "1px solid var(--glass-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
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
            Setup
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            Up and running in 3 steps
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
            No complicated setup. Connect once, query forever.
          </p>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={i} delay={i * 0.1} className="landing-feature-card">
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "var(--accent)",
                    marginBottom: 16,
                    textTransform: "uppercase",
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(0,179,179,0.07)",
                    border: "1px solid rgba(0,179,179,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon size={20} color="var(--accent-light)" strokeWidth={1.5} />
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 10,
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Features - asymmetric layout
   ---------------------------------------------------------------- */
const features = [
  {
    icon: Layers,
    title: "Multi-property support",
    desc: "Connect and query multiple GSC, GA4, and GBP properties at once. Manage all your clients under one account.",
  },
  {
    icon: Zap,
    title: "30 MCP tools",
    desc: "Search analytics, top keywords, top pages, URL inspection, GA4 reports, GBP reviews and performance - all as native tools.",
  },
  {
    icon: ShieldCheck,
    title: "End-to-end encrypted",
    desc: "Your Google refresh tokens are encrypted with AES-256-GCM. Keys never leave your environment.",
  },
  {
    icon: Key,
    title: "Two auth methods",
    desc: "Native OAuth2 for Claude.ai. API keys for Claude Desktop, Cursor, and any MCP-compatible client.",
  },
  {
    icon: Activity,
    title: "Rate limit aware",
    desc: "Per-user rate limiting baked in. Your Google API quota is always respected, never blown.",
  },
  {
    icon: Users,
    title: "Agency ready",
    desc: "Manage client properties under one login. Per-property access controls and usage tracking.",
  },
];

function FeaturesSection() {
  return (
    <section
      id="features"
      style={{ padding: "96px 0", borderTop: "1px solid var(--glass-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
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
            Features
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            Everything your AI assistant needs
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
            30 tools spanning Google Search Console, Analytics 4, and Business Profile.
          </p>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={i} delay={i * 0.08} className="landing-feature-card">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(0,179,179,0.06)",
                    border: "1px solid rgba(0,179,179,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon size={18} color="var(--accent-light)" strokeWidth={1.5} />
                </div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Tools showcase
   ---------------------------------------------------------------- */
const toolCategories = [
  {
    label: "Google Search Console",
    count: 13,
    color: "var(--accent)",
    tools: [
      { icon: BarChart3, name: "get_search_analytics", desc: "Full analytics query" },
      { icon: TrendingUp, name: "get_top_keywords", desc: "Top queries by dimension" },
      { icon: FileText, name: "get_top_pages", desc: "Top pages by clicks" },
      { icon: Search, name: "get_keyword_for_page", desc: "Keywords per URL" },
      { icon: FileSearch, name: "inspect_url", desc: "URL index status" },
      { icon: List, name: "list_sitemaps", desc: "All sitemaps" },
      { icon: FileText, name: "get_sitemap", desc: "Sitemap details" },
      { icon: PlusCircle, name: "submit_sitemap", desc: "Submit new sitemap" },
      { icon: Trash2, name: "delete_sitemap", desc: "Remove sitemap" },
      { icon: Globe, name: "list_sites", desc: "All verified sites" },
      { icon: PlusCircle, name: "add_site", desc: "Add new property" },
      { icon: Trash2, name: "delete_site", desc: "Remove property" },
      { icon: Smartphone, name: "run_mobile_friendly_test", desc: "Mobile test URL" },
    ],
  },
  {
    label: "Google Analytics 4",
    count: 10,
    color: "#6366F1",
    tools: [
      { icon: Activity, name: "ga4_run_report", desc: "Custom GA4 reports" },
      { icon: TrendingUp, name: "ga4_get_realtime", desc: "Realtime active users" },
      { icon: Users, name: "ga4_audience", desc: "Audience segments" },
      { icon: MousePointer, name: "ga4_events", desc: "Event analytics" },
      { icon: Eye, name: "ga4_page_views", desc: "Page view metrics" },
      { icon: Target, name: "ga4_conversions", desc: "Conversion tracking" },
      { icon: Timer, name: "ga4_engagement", desc: "Engagement metrics" },
      { icon: Globe, name: "ga4_geo", desc: "Geographic breakdown" },
      { icon: Smartphone, name: "ga4_devices", desc: "Device categories" },
      { icon: LineChart, name: "ga4_trends", desc: "Traffic trends" },
    ],
  },
  {
    label: "Google Business Profile",
    count: 7,
    color: "#F59E0B",
    tools: [
      { icon: MapPin, name: "gbp_list_locations", desc: "All GBP locations" },
      { icon: Star, name: "gbp_get_reviews", desc: "Customer reviews" },
      { icon: BarChart3, name: "gbp_get_performance", desc: "Profile performance" },
      { icon: Search, name: "gbp_search_keywords", desc: "Search terms" },
      { icon: Rss, name: "gbp_get_posts", desc: "Business posts" },
      { icon: Image, name: "gbp_get_media", desc: "Photos and media" },
      { icon: Map, name: "gbp_location_overview", desc: "Location summary" },
    ],
  },
];

function ToolsSection() {
  return (
    <section
      style={{ padding: "96px 0", borderTop: "1px solid var(--glass-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
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
            MCP Tools
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            30 tools across 3 platforms
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
            Every tool your AI assistant needs to understand, analyze, and act on your search and local data.
          </p>
        </Reveal>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {toolCategories.map((cat, ci) => (
            <Reveal
              key={ci}
              delay={ci * 0.12}
              style={{
                background: "rgba(14,20,32,0.3)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                padding: "28px 28px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: cat.color,
                    boxShadow: `0 0 8px ${cat.color}`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  {cat.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginLeft: 2 }}>
                  {cat.count} tools
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {cat.tools.map((tool, ti) => {
                  const Icon = tool.icon;
                  return (
                    <div key={ti} className="tool-chip">
                      <Icon size={13} color="var(--text-muted)" strokeWidth={1.5} />
                      <span>{tool.name}</span>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Pricing
   ---------------------------------------------------------------- */
function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      desc: "For individuals getting started.",
      features: [
        "1 GSC property",
        "100 queries / day",
        "All 30 MCP tools",
        "Claude.ai + Claude Desktop",
        "Community support",
      ],
      cta: "Get started free",
      ctaHref: "/api/auth/google",
      featured: false,
    },
    {
      name: "Pro",
      price: "$X", // TODO: STRIPE - set real price
      period: "/month",
      desc: "For SEO professionals and growing sites.",
      features: [
        "Up to 10 GSC properties",
        "10,000 queries / day",
        "All 30 MCP tools",
        "GA4 + GBP integrations",
        "Priority support",
      ],
      cta: "Start with Pro",
      ctaHref: "/api/auth/google",
      featured: true,
      badge: "Most popular",
    },
    {
      name: "Agency",
      price: "$X", // TODO: STRIPE - set real price
      period: "/month",
      desc: "For agencies managing multiple clients.",
      features: [
        "Up to 100 properties",
        "100,000 queries / day",
        "All 30 MCP tools",
        "Client property management",
        "Dedicated support",
      ],
      cta: "Start with Agency",
      ctaHref: "/api/auth/google",
      featured: false,
    },
  ];

  return (
    <section
      id="pricing"
      style={{ padding: "96px 0", borderTop: "1px solid var(--glass-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
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
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 440, margin: "0 auto" }}>
            Start free. Upgrade when you need more properties or queries.
          </p>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            maxWidth: 960,
            margin: "0 auto",
          }}
        >
          {plans.map((plan, i) => (
            <Reveal
              key={i}
              delay={i * 0.1}
              className={`pricing-card${plan.featured ? " pricing-card-featured" : ""}`}
              style={{ position: "relative" }}
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
                  {plan.desc}
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {plan.features.map((feat, fi) => (
                    <li
                      key={fi}
                      style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}
                    >
                      <Check
                        size={15}
                        color="var(--accent-light)"
                        strokeWidth={2.5}
                        style={{ flexShrink: 0 }}
                      />
                      <span style={{ color: "var(--text-secondary)" }}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaHref}
                  className={plan.featured ? "btn-primary" : "btn-ghost"}
                  style={{ width: "100%", justifyContent: "center", fontSize: 14 }}
                >
                  {plan.cta}
                  {plan.featured && <ArrowRight size={15} />}
                </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Closing CTA section
   ---------------------------------------------------------------- */
function CtaSection() {
  return (
    <section
      style={{ padding: "96px 0", borderTop: "1px solid var(--glass-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal
          style={{
            position: "relative",
            textAlign: "center",
            padding: "72px 32px",
            borderRadius: "var(--radius-xl)",
            background: "rgba(14,20,32,0.5)",
            border: "1px solid rgba(0,179,179,0.12)",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 600,
              height: 300,
              background: "radial-gradient(ellipse, rgba(0,179,179,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--accent-light)",
                marginBottom: 16,
              }}
            >
              Get started today
            </div>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                marginBottom: 16,
                maxWidth: 600,
                margin: "0 auto 16px",
                lineHeight: 1.2,
              }}
            >
              Start querying your data in 5 minutes
            </h2>
            <p
              style={{
                fontSize: 16,
                color: "var(--text-secondary)",
                maxWidth: 480,
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              Free to start. Connect your Google account and ask your first question in under 5 minutes - no credit card required.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <a
                href="/api/auth/google"
                className="btn-primary"
                style={{ fontSize: 15, padding: "12px 28px" }}
              >
                Connect Google - Free
                <ArrowRight size={16} />
              </a>
              <a
                href="/guides"
                className="btn-ghost"
                style={{ fontSize: 15, padding: "12px 28px" }}
              >
                Read the guides
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------
   Footer
   ---------------------------------------------------------------- */
function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--glass-border)",
        padding: "40px 0",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Top row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            {/* Brand */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <img src="/OMG Rectangle LOGO Dark BG.svg" alt="OMG AI" style={{ height: 28, width: "auto" }} />
              <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 260, lineHeight: 1.5 }}>
                Google Search Console, Analytics, and Business Profile - as MCP tools for any AI assistant.
              </p>
            </div>

            {/* Links */}
            <div
              style={{
                display: "flex",
                gap: 48,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Product
                </span>
                {[
                  { href: "#how-it-works", label: "How it works" },
                  { href: "/features", label: "Features" },
                  { href: "/pricing", label: "Pricing" },
                ].map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text-primary)")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-secondary)")}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Resources
                </span>
                {[
                  { href: "/guides", label: "Guides" },
                  { href: "/faq", label: "FAQ" },
                  { href: "/dashboard", label: "Dashboard" },
                ].map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text-primary)")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-secondary)")}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--glass-border)",
              paddingTop: 24,
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              &copy; {new Date().getFullYear()} OMG AI. All rights reserved.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Built on</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--accent)",
                  background: "rgba(0,179,179,0.07)",
                  border: "1px solid rgba(0,179,179,0.15)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                MCP
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------------
   Main page
   ---------------------------------------------------------------- */
export default function LandingPage() {
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* ---- Hero ---- */}
      <section
        style={{
          position: "relative",
          minHeight: "92vh",
          display: "flex",
          alignItems: "center",
          padding: "100px 0 80px",
        }}
      >
        {/* Background decorations */}
        <div className="hero-orb hero-orb-teal" />
        <div className="hero-orb hero-orb-purple" />
        <div className="hero-grid-bg" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 64,
              alignItems: "center",
            }}
            className="hero-grid-layout"
          >
            {/* Left: Text */}
            <div>
              {/* Badge */}
              <div
                className="landing-badge anim-fade-up"
                style={{ animationDelay: "0ms" }}
              >
                <span className="status-dot status-dot-success" />
                Now in beta - free during launch
              </div>

              {/* H1 */}
              <h1
                className="anim-fade-up"
                style={{
                  animationDelay: "80ms",
                  fontSize: "clamp(36px, 5vw, 60px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  color: "var(--text-primary)",
                  marginBottom: 20,
                }}
              >
                Your SEO data,
                <br />
                <span
                  style={{
                    color: "var(--accent-light)",
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  queryable
                </span>{" "}
                in plain
                <br />
                English
              </h1>

              {/* Subtitle */}
              <p
                className="anim-fade-up"
                style={{
                  animationDelay: "180ms",
                  fontSize: 17,
                  color: "var(--text-secondary)",
                  lineHeight: 1.65,
                  marginBottom: 32,
                  maxWidth: 480,
                }}
              >
                OMG AI connects Google Search Console, Analytics 4, and Business Profile
                to Claude, ChatGPT, and Cursor via the Model Context Protocol. No SQL,
                no dashboards - just ask.
              </p>

              {/* CTAs */}
              <div
                className="anim-fade-up"
                style={{
                  animationDelay: "270ms",
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 32,
                }}
              >
                <a
                  href="/api/auth/google"
                  className="btn-primary"
                  style={{ fontSize: 15, padding: "12px 24px" }}
                >
                  Connect Google - Free
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#how-it-works"
                  className="btn-ghost"
                  style={{ fontSize: 15, padding: "12px 24px" }}
                >
                  See how it works
                </a>
              </div>

              {/* Trust signals */}
              <div
                className="anim-fade-up"
                style={{
                  animationDelay: "360ms",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                {[
                  { icon: Zap, text: "30 MCP tools" },
                  { icon: Lock, text: "AES-256 encrypted" },
                  { icon: ShieldCheck, text: "OAuth2 + PKCE" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "var(--text-muted)",
                      }}
                    >
                      <Icon size={13} strokeWidth={1.5} />
                      {item.text}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Product preview */}
            <div
              className="anim-slide-right"
              style={{ animationDelay: "200ms" }}
            >
              <div className="anim-float" style={{ display: "flex", justifyContent: "center" }}>
                <ChatPreviewCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive hero grid */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <IntegrationsBar />
      <HowItWorksSection />
      <FeaturesSection />
      <ToolsSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
