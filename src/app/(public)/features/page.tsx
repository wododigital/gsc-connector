import type { Metadata } from "next";
import Link from "next/link";

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
  { title: "Photos and Media", description: "Audit the media attached to each location." },
  { title: "Location Overview", description: "Summary view per location with key metrics in one call." },
];

interface ProductColumn {
  number: string;
  title: string;
  count: number;
  blurb: string;
  features: { title: string; description: string }[];
  highlight: boolean;
}

const columns: ProductColumn[] = [
  {
    number: "01",
    title: "Google Search Console",
    count: 13,
    blurb:
      "13 MCP tools covering every aspect of GSC. From search analytics to site verification.",
    features: gscFeatures,
    highlight: true,
  },
  {
    number: "02",
    title: "Google Analytics 4",
    count: 10,
    blurb:
      "10 MCP tools bringing your GA4 traffic, conversion, and audience data into every AI conversation.",
    features: ga4Features,
    highlight: false,
  },
  {
    number: "03",
    title: "Google Business Profile",
    count: 7,
    blurb:
      "7 MCP tools so your AI can read GBP locations, reviews, search keywords, and performance.",
    features: gbpFeatures,
    highlight: false,
  },
];

export default function FeaturesPage() {
  return (
    <div className="page-shell">
      {/* HERO */}
      <section className="page-hero">
        <div className="page-hero-body">
          <div className="section-eyebrow">
            <span className="num">01</span>
            <span>FEATURES</span>
            <span className="rule" />
          </div>
          <h1>
            Every SEO insight,
            <br />
            <span className="underline">inside</span> your{" "}
            <span className="accent">AI assistant.</span>
          </h1>
          <p className="lede">
            OMG Bridge gives Claude, ChatGPT, and Cursor direct access to your
            Google Search Console, GA4, and Business Profile data via the
            Model Context Protocol. 30 tools. One endpoint.
          </p>
        </div>
      </section>

      {/* PRODUCT COLUMNS */}
      <section className="prod-section">
        <div className="prod-body">
          <div className="prod-grid">
            {columns.map((col) => (
              <article
                key={col.title}
                className={`prod-card${col.highlight ? " highlight" : ""}`}
              >
                <div className="prod-head">
                  <div className="prod-num">{col.number}</div>
                  <div>
                    <h2>{col.title}</h2>
                    <div className="prod-count">{col.count} MCP TOOLS</div>
                  </div>
                </div>
                <p className="prod-blurb">{col.blurb}</p>
                <ul>
                  {col.features.map((f) => (
                    <li key={f.title}>
                      <span className="plus">+</span>
                      <div>
                        <div className="ftitle">{f.title}</div>
                        <div className="fdesc">{f.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WORKS WITH STRIP */}
      <section className="works-section">
        <div className="works-body">
          <h3>
            Works in the AI tools you<br />
            <span className="accent">already use.</span>
          </h3>
          <div className="works-pills">
            {["Claude.ai", "Claude Desktop", "Cursor", "ChatGPT", "Gemini", "Copilot"].map((t) => (
              <span key={t} className="works-pill">
                {t}
              </span>
            ))}
          </div>
          <div className="works-cta">
            <Link href="/onboarding" className="btn btn-primary">
              Start Free →
            </Link>
            <Link href="/guides" className="btn">
              Read setup guides
            </Link>
          </div>
        </div>
      </section>

      <PageStyles />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Shared page styles (reused on Pricing/FAQ/Guides via copy)
   ──────────────────────────────────────────────────────────── */
function PageStyles() {
  return (
    <style>{`
      .page-shell { min-height: 100%; }

      /* page hero */
      .page-hero {
        display: block;
        border-bottom: 1px solid var(--rule);
      }
      .page-hero-body {
        padding: 64px 56px 72px;
        max-width: 1100px;
      }
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

      /* product section */
      .prod-section {
        display: block;
        border-bottom: 1px solid var(--rule);
      }
      .prod-body { padding: 56px 56px 72px; }

      .prod-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border: 1px solid var(--rule-strong);
      }
      .prod-card {
        padding: 32px;
        background: var(--surface-1);
        border-right: 1px solid var(--rule-strong);
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .prod-card:last-child { border-right: none; }
      .prod-card.highlight {
        background: var(--bg);
        box-shadow: inset 4px 0 0 var(--teal);
        padding-left: 36px;
        border-right: 1px solid rgba(0, 181, 181, 0.5);
      }
      .prod-head {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--rule);
      }
      .prod-num {
        font-family: var(--display);
        font-weight: 700;
        font-size: 38px;
        line-height: 0.9;
        color: var(--teal);
        letter-spacing: -0.04em;
      }
      .prod-card.highlight .prod-num { color: var(--teal-bright); }
      .prod-head h2 {
        font-family: var(--display);
        font-weight: 700;
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: -0.015em;
        line-height: 1.1;
        color: var(--ink);
        margin-bottom: 4px;
      }
      .prod-count {
        font-size: 10px;
        letter-spacing: 0.18em;
        color: var(--vermilion);
        font-weight: 600;
      }
      .prod-blurb {
        font-size: 13px;
        color: var(--ink-2);
        line-height: 1.65;
      }
      .prod-card ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
      }
      .prod-card ul li {
        display: flex;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--rule);
      }
      .prod-card ul li:last-child { border-bottom: none; }
      .prod-card ul li .plus {
        color: var(--teal-bright);
        font-weight: 700;
        flex-shrink: 0;
        font-size: 14px;
      }
      .prod-card ul li .ftitle {
        font-size: 13px;
        font-weight: 600;
        color: var(--ink);
        margin-bottom: 2px;
      }
      .prod-card ul li .fdesc {
        font-size: 12px;
        color: var(--ink-3);
        line-height: 1.55;
      }

      /* works section */
      .works-section {
        display: block;
        border-bottom: 1px solid var(--rule);
        background: var(--surface-1);
      }
      .works-body { padding: 64px 56px 72px; max-width: 900px; }
      .works-body h3 {
        font-family: var(--display);
        font-weight: 700;
        font-size: clamp(28px, 3.6vw, 42px);
        line-height: 1.05;
        letter-spacing: -0.035em;
        text-transform: uppercase;
        margin-bottom: 32px;
      }
      .works-body h3 .accent { color: var(--vermilion); }
      .works-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 32px;
      }
      .works-pill {
        padding: 10px 18px;
        background: var(--bg);
        border: 1px solid var(--rule-strong);
        color: var(--ink-2);
        font-size: 12px;
        letter-spacing: 0.05em;
        font-family: var(--body);
        font-weight: 500;
        transition: border-color 0.18s, color 0.18s;
      }
      .works-pill:hover { border-color: var(--teal); color: var(--teal-bright); }
      .works-cta { display: flex; gap: 12px; flex-wrap: wrap; }

      @media (max-width: 980px) {
        .page-hero-body { padding: 40px 20px 48px; }
        .prod-body { padding: 32px 20px 56px; }
        .works-body { padding: 40px 20px 56px; }
        .prod-grid { grid-template-columns: 1fr; }
        .prod-card {
          border-right: none;
          border-bottom: 1px solid var(--rule-strong);
        }
        .prod-card:last-child { border-bottom: none; }
      }
    `}</style>
  );
}
