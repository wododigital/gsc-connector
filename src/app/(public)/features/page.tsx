import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features - OMG AI",
  description: "Connect Google Search Console and GA4 to Claude, ChatGPT, and Cursor via MCP.",
};

export default function FeaturesPage() {
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">
          Every SEO insight, inside your AI assistant
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          OMG AI gives Claude, ChatGPT, and Cursor direct access to your Google Search Console and GA4 data via the Model Context Protocol.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-20">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Google Search Console</h2>
          </div>
          <p className="text-zinc-400 mb-6">13 MCP tools covering every aspect of GSC - from search analytics to site verification.</p>
          <div className="space-y-3">
            {gscFeatures.map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="text-green-400 mt-0.5 flex-shrink-0">&#10003;</span>
                <div>
                  <p className="text-white font-medium text-sm">{f.title}</p>
                  <p className="text-zinc-500 text-sm">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Google Analytics 4</h2>
          </div>
          <p className="text-zinc-400 mb-6">10 MCP tools bringing your GA4 traffic, conversion, and audience data into every AI conversation.</p>
          <div className="space-y-3">
            {ga4Features.map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="text-orange-400 mt-0.5 flex-shrink-0">&#10003;</span>
                <div>
                  <p className="text-white font-medium text-sm">{f.title}</p>
                  <p className="text-zinc-500 text-sm">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Works with your AI tools</h2>
        <p className="text-zinc-400 mb-6">One MCP endpoint that connects to Claude.ai, Claude Desktop, Cursor, and any MCP-compatible tool.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          {["Claude.ai", "Claude Desktop", "Cursor", "ChatGPT (coming soon)"].map((tool) => (
            <span key={tool} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-sm">{tool}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
