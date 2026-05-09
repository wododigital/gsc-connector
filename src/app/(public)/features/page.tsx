import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features - OMG Bridge",
  description:
    "30 MCP tools across Google Search Console, Analytics 4, and Business Profile - inside Claude, ChatGPT, and Cursor.",
};

const gscFeatures = [
  { title: "Search Analytics", description: "Query clicks, impressions, CTR, and position data from Google Search Console." },
  { title: "Top Keywords", description: "Identify your highest-performing search queries with detailed metrics." },
  { title: "Top Pages", description: "See which pages drive the most organic traffic." },
  { title: "URL Inspection", description: "Inspect any URL for indexing status, crawl errors, and structured data." },
  { title: "Sitemap Management", description: "List, submit, and manage XML sitemaps directly from your AI assistant." },
  { title: "Site Management", description: "Add, remove, and verify GSC properties from your AI tools." },
  { title: "Mobile Friendly Test", description: "Run Google's mobile-friendliness test on any URL." },
];

const ga4Features = [
  { title: "Traffic Analytics", description: "Analyze sessions, users, pageviews, and engagement metrics." },
  { title: "Top Pages by Traffic", description: "Identify which pages attract the most visitors." },
  { title: "Traffic Sources", description: "Break down traffic by source, medium, and campaign." },
  { title: "User Journey", description: "Understand how users navigate through your site." },
  { title: "Conversion Tracking", description: "Analyze goal completions and conversion rates." },
  { title: "Audience Insights", description: "Explore demographics, devices, and geographic data." },
  { title: "Real-time Data", description: "See active users and live event data." },
];

const gbpFeatures = [
  { title: "Locations", description: "List all Google Business Profile locations under your account." },
  { title: "Reviews", description: "Pull in customer reviews, ratings, and replies for any location." },
  { title: "Performance", description: "Track profile views, search impressions, and customer actions." },
  { title: "Search Keywords", description: "See the actual search terms people used to find your business." },
  { title: "Posts", description: "Read business posts and announcements published to your profile." },
  { title: "Photos & Media", description: "Audit the media attached to each location." },
  { title: "Location Overview", description: "Summary view per location with key metrics in one call." },
];

interface SectionProps {
  title: string;
  count: number;
  blurb: string;
  accent: string;
  features: { title: string; description: string }[];
}

function FeatureSection({ title, count, blurb, accent, features }: SectionProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-sm)",
            background: `${accent}1A`,
            border: `1px solid ${accent}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}` }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {count} MCP tools
          </p>
        </div>
      </div>
      <p className="mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
        {blurb}
      </p>
      <div className="space-y-3">
        {features.map((f) => (
          <div key={f.title} className="flex gap-3">
            <span style={{ color: accent, marginTop: 2, flexShrink: 0, fontWeight: 700 }}>✓</span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.title}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
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
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          Every SEO insight, inside your AI assistant
        </h1>
        <p
          className="text-xl max-w-2xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          OMG Bridge gives Claude, ChatGPT, and Cursor direct access to your Google Search Console, GA4, and Business Profile data via the Model Context Protocol.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-12 mb-20">
        <FeatureSection
          title="Google Search Console"
          count={13}
          blurb="13 MCP tools covering every aspect of GSC - from search analytics to site verification."
          accent="var(--accent)"
          features={gscFeatures}
        />
        <FeatureSection
          title="Google Analytics 4"
          count={10}
          blurb="10 MCP tools bringing your GA4 traffic, conversion, and audience data into every AI conversation."
          accent="#6366F1"
          features={ga4Features}
        />
        <FeatureSection
          title="Google Business Profile"
          count={7}
          blurb="7 MCP tools so your AI can read GBP locations, reviews, search keywords, and performance."
          accent="#F59E0B"
          features={gbpFeatures}
        />
      </div>

      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: "rgba(14,20,32,0.5)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Works with your AI tools
        </h2>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
          One MCP endpoint that connects to Claude.ai, Claude Desktop, Cursor, ChatGPT, and any MCP-compatible tool.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          {["Claude.ai", "Claude Desktop", "Cursor", "ChatGPT"].map((tool) => (
            <span
              key={tool}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-secondary)",
                fontSize: 14,
              }}
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
