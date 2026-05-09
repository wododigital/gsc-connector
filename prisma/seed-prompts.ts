/**
 * Default prompt template definitions.
 * Imported by prisma/seed.ts and by the /api/admin/prompts/seed route.
 */

export interface PromptSeed {
  slug: string; // stable identifier for upsert (becomes a deterministic uuid v5-ish key via title)
  title: string;
  description: string;
  category: string;
  requiredConnections: string[];
  questions: string[];
  body: string;
  semanticTags: string[];
  sortOrder: number;
}

const REPORT_FORMAT_BLOCK =
  "### Report Format:\n" +
  "- Generate the report as a single self-contained HTML file (no external CSS/JS imports).\n" +
  "- Use the brand profile below for all styling. Map the colors into CSS variables on `:root` and reference them throughout.\n" +
  "- Honor the report theme: if 'dark', the page uses a dark background with light text; if 'light', white background with dark text. The brand profile already gives you the right bg, text, card and border colors for the chosen theme - use them as-is.\n" +
  "- Use {{brand.logoUrl}} for the header logo (it has been pre-selected for the chosen theme).\n" +
  "- Include: branded header with logo + report title + date range, executive summary paragraph, " +
  "data cards for headline metrics, tabbed or sectioned breakdowns, data tables for row-level detail, " +
  "and short commentary explaining what the data means and what to do next.\n" +
  '- Add a fixed-position "Download as PDF" button in the bottom-right that calls window.print().\n' +
  "- Use @media print rules to hide the button and ensure good page breaks.\n" +
  "- Keep numbers human-readable: format big counts with commas, percentages with 1 decimal, currencies with symbols.\n\n" +
  "### Brand Profile:\n" +
  "- Company: {{brand.companyName}}\n" +
  "- Logo URL: {{brand.logoUrl}}\n" +
  "- Report Theme: {{brand.reportTheme}}  (use this to choose the overall color scheme)\n" +
  "- Primary Color: {{brand.primaryColor}}  (headers, key callouts, primary buttons)\n" +
  "- Secondary Color: {{brand.secondaryColor}}  (deep accents, dark-bg sections)\n" +
  "- Accent Color: {{brand.accentColor}}  (secondary highlights, links, badges)\n" +
  "- Background: {{brand.bgColor}}\n" +
  "- Text: {{brand.textColor}}\n" +
  "- Muted Text: {{brand.textMutedColor}}\n" +
  "- Card Background: {{brand.cardBgColor}}\n" +
  "- Border: {{brand.borderColor}}\n" +
  "- Font: {{brand.fontFamily}}\n";

function wrap(title: string, questions: string[], instructions: string): string {
  const qList = questions.map((q) => `- ${q}`).join("\n");
  return [
    `## ${title}`,
    "",
    "### Before generating this report, ask the user the following questions:",
    qList,
    "",
    "### Once all questions are answered, generate the report using these instructions:",
    "",
    instructions.trim(),
    "",
    REPORT_FORMAT_BLOCK,
  ].join("\n");
}

export const DEFAULT_PROMPTS: PromptSeed[] = [
  {
    slug: "monthly-seo-performance",
    title: "Monthly SEO Performance Report",
    description: "Comprehensive monthly report covering organic traffic, keyword rankings, page performance, and trends.",
    category: "seo-report",
    requiredConnections: ["gsc", "ga4"],
    sortOrder: 10,
    questions: [
      "Which client or property is this report for?",
      "What date range should I use? (e.g. last full month, last 30 days)",
      "Should I compare against the previous period?",
      "Any specific keywords or pages to highlight?",
      "Should I include GA4 traffic data alongside GSC data?",
    ],
    body: wrap(
      "Monthly SEO Performance Report",
      [
        "Which client or property is this report for?",
        "What date range should I use? (e.g. last full month, last 30 days)",
        "Should I compare against the previous period?",
        "Any specific keywords or pages to highlight?",
        "Should I include GA4 traffic data alongside GSC data?",
      ],
      "Pull GSC search analytics for the chosen date range using `get_search_analytics` (clicks, impressions, CTR, position). " +
        "Use `get_top_keywords` and `get_top_pages` for the leaderboards. " +
        "If the user asked for a comparison period, fetch the same metrics for the prior window and calculate deltas. " +
        "If GA4 was requested, call `ga_run_report` for sessions, engaged sessions, conversions, and `ga_traffic_sources` for the channel breakdown. " +
        "Group findings into: (1) headline KPIs, (2) keyword movement (winners/losers), (3) top landing pages, " +
        "(4) traffic source mix, (5) commentary on what changed and why, (6) 3-5 recommended actions.",
    ),
    semanticTags: ["organic traffic","keyword ranking","ctr","monthly report","clicks","impressions","seo performance","trend analysis"],
  },
  {
    slug: "ai-traffic-analysis",
    title: "AI Traffic Analysis Report",
    description: "Analyze traffic from AI referrers (ChatGPT, Perplexity, Claude, Gemini) versus traditional organic search.",
    category: "aeo",
    requiredConnections: ["gsc", "ga4"],
    sortOrder: 20,
    questions: [
      "Which property are we analyzing?",
      "What date range? (last 30/60/90 days)",
      "Should I include a comparison vs the previous period?",
      "Any specific AI source to focus on (ChatGPT, Perplexity, Claude, Gemini)?",
      "Do you want a per-page breakdown of which content is being cited?",
    ],
    body: wrap(
      "AI Traffic Analysis Report",
      [
        "Which property are we analyzing?",
        "What date range? (last 30/60/90 days)",
        "Should I include a comparison vs the previous period?",
        "Any specific AI source to focus on (ChatGPT, Perplexity, Claude, Gemini)?",
        "Do you want a per-page breakdown of which content is being cited?",
      ],
      "Use `ga_traffic_sources` to identify referral sources. Filter for hosts containing chat.openai.com, chatgpt.com, perplexity.ai, claude.ai, copilot.microsoft.com, gemini.google.com, you.com, phind.com. " +
        "Cross-reference with `ga_top_pages` to find which URLs receive AI referrals. Pull `get_search_analytics` for the same window so the report can compare AI-referral sessions vs Google organic clicks. " +
        "Sections to produce: (1) AI traffic snapshot (sessions, engaged sessions, conversions per AI source), (2) AI vs traditional organic mix, " +
        "(3) top cited pages (sessions, top entry pages, time on page), (4) week-over-week trend, " +
        "(5) commentary on which content formats AI engines cite most, (6) recommendations to improve AI visibility (structure, citability, schema).",
    ),
    semanticTags: ["ai traffic","aeo","chatgpt","perplexity","llm referrals","generative search","ai visibility","citation"],
  },
  {
    slug: "keyword-gap-opportunity",
    title: "Keyword Gap & Opportunity Report",
    description: "Identify declining keywords, rising opportunities, striking-distance terms, and quick wins.",
    category: "seo-report",
    requiredConnections: ["gsc"],
    sortOrder: 30,
    questions: [
      "Which property?",
      "What date range for the current period? (e.g. last 28 days)",
      "What date range for the comparison period?",
      "Filter by country or device?",
      "Any keyword theme to focus on?",
    ],
    body: wrap(
      "Keyword Gap & Opportunity Report",
      [
        "Which property?",
        "What date range for the current period? (e.g. last 28 days)",
        "What date range for the comparison period?",
        "Filter by country or device?",
        "Any keyword theme to focus on?",
      ],
      "Pull `get_top_keywords` for both the current and comparison windows (use a high `row_limit` like 1000). " +
        "Compute deltas in clicks, impressions, average position. Bucket keywords into: " +
        "(1) declining (lost clicks, position dropped), (2) rising (new or growing terms), " +
        "(3) striking-distance (positions 4-15 with high impressions), (4) low-CTR opportunities (position <=10 but CTR below the SERP average for that position). " +
        "For striking-distance and low-CTR sets, list 10-20 with their landing pages (use `get_keyword_for_page`). " +
        "End with a prioritized action list - which keywords to target first and why.",
    ),
    semanticTags: ["keyword gap","striking distance","quick wins","declining keywords","ranking opportunities","ctr optimization"],
  },
  {
    slug: "technical-seo-health",
    title: "Technical SEO Health Check",
    description: "Index coverage, mobile-friendliness, sitemap status, and crawl issues based on GSC URL Inspection.",
    category: "technical-seo",
    requiredConnections: ["gsc"],
    sortOrder: 40,
    questions: [
      "Which property?",
      "Should I sample specific high-traffic pages, or run against a list you provide?",
      "Include the mobile-friendly test for sample URLs?",
      "Check sitemap submission status?",
      "How many URLs to sample? (default: top 25 by clicks)",
    ],
    body: wrap(
      "Technical SEO Health Check",
      [
        "Which property?",
        "Should I sample specific high-traffic pages, or run against a list you provide?",
        "Include the mobile-friendly test for sample URLs?",
        "Check sitemap submission status?",
        "How many URLs to sample? (default: top 25 by clicks)",
      ],
      "Build the URL sample with `get_top_pages` (sorted by clicks) unless the user provides a list. " +
        "For each URL run `inspect_url` and capture indexing verdict, coverage state, robots.txt state, last crawl, mobile usability, rich-results detection. " +
        "If requested, run `run_mobile_friendly_test` on a smaller sample (5-10) since this is rate-limited. " +
        "Call `list_sitemaps` and `get_sitemap` to surface submission status, errors, warnings, and indexed counts. " +
        "Group results into: (1) index coverage summary (indexed / not indexed / excluded counts), " +
        "(2) URLs with crawl or canonical issues, (3) mobile usability problems, (4) sitemap health, (5) recommended fixes ranked by impact.",
    ),
    semanticTags: ["technical seo","index coverage","crawl issues","mobile friendly","sitemap","url inspection","robots"],
  },
  {
    slug: "page-performance-deep-dive",
    title: "Page Performance Deep Dive",
    description: "Analyze specific pages: clicks, impressions, CTR, position, sessions, engagement, and conversions.",
    category: "traffic-analysis",
    requiredConnections: ["gsc", "ga4"],
    sortOrder: 50,
    questions: [
      "Which property?",
      "Which URLs do you want analyzed? (paste them or say 'top 10 by clicks')",
      "What date range?",
      "Compare against the previous period?",
      "Should I include the queries each page ranks for?",
    ],
    body: wrap(
      "Page Performance Deep Dive",
      [
        "Which property?",
        "Which URLs do you want analyzed? (paste them or say 'top 10 by clicks')",
        "What date range?",
        "Compare against the previous period?",
        "Should I include the queries each page ranks for?",
      ],
      "If the user said 'top N by clicks', resolve the list with `get_top_pages`. " +
        "For each URL pull `get_search_analytics` filtered to that page (clicks, impressions, CTR, position) and `get_keyword_for_page` to surface ranking queries. " +
        "From GA4 use `ga_page_performance` for sessions, engaged sessions, average engagement time, conversions, bounce rate. " +
        "If a comparison period was requested, repeat for the prior window and compute deltas. " +
        "Layout: one section per page with a card row of headline metrics, a queries table, an engagement table, and a 2-3 sentence commentary. " +
        "Close with cross-page observations and recommendations.",
    ),
    semanticTags: ["page performance","landing pages","engagement","conversions","queries","ctr","bounce rate"],
  },
  {
    slug: "traffic-source-breakdown",
    title: "Traffic Source Breakdown",
    description: "Organic, paid, social, referral, direct and AI traffic mix with channel-level performance.",
    category: "traffic-analysis",
    requiredConnections: ["ga4"],
    sortOrder: 60,
    questions: [
      "Which GA4 property?",
      "What date range?",
      "Compare against the previous period?",
      "Should I break down by default channel grouping or by source/medium?",
      "Any specific conversion events to include?",
    ],
    body: wrap(
      "Traffic Source Breakdown",
      [
        "Which GA4 property?",
        "What date range?",
        "Compare against the previous period?",
        "Should I break down by default channel grouping or by source/medium?",
        "Any specific conversion events to include?",
      ],
      "Use `ga_traffic_sources` for the chosen breakdown (default channel grouping or sessionSource/sessionMedium). " +
        "Pull `ga_run_report` for sessions, engaged sessions, conversions and revenue (if available) for the same window. " +
        "Use `ga_realtime` for a current-state snapshot at the bottom of the report. " +
        "If a comparison period was requested, fetch the prior window and compute deltas per channel. " +
        "Sections: (1) overall traffic + conversion KPIs, (2) channel mix (table + share-of-voice chart described in HTML/CSS), " +
        "(3) top performing source/medium pairs, (4) AI referrals callout (chatgpt.com, perplexity.ai, claude.ai, gemini.google.com), " +
        "(5) commentary and recommendations on channel investment.",
    ),
    semanticTags: ["traffic sources","channel mix","ga4","sessions","conversions","attribution","referral"],
  },
  {
    slug: "gbp-summary",
    title: "Google Business Profile Summary",
    description: "Reviews, search queries, profile performance, posts and photos audit for a Business Profile location.",
    category: "gbp-report",
    requiredConnections: ["gbp"],
    sortOrder: 70,
    questions: [
      "Which Business Profile location should I report on?",
      "What date range? (GBP insights typically support last 30/90/180 days)",
      "Should I include the latest reviews and respond-rate analysis?",
      "Include a competitor or category comparison?",
      "Any specific concern (e.g. ranking drops, review spike) to focus on?",
    ],
    body: wrap(
      "Google Business Profile Summary",
      [
        "Which Business Profile location should I report on?",
        "What date range? (GBP insights typically support last 30/90/180 days)",
        "Should I include the latest reviews and respond-rate analysis?",
        "Include a competitor or category comparison?",
        "Any specific concern (e.g. ranking drops, review spike) to focus on?",
      ],
      "Use the available GBP MCP tools to gather profile metrics: discovery searches, direct searches, profile views, " +
        "calls, direction requests, website clicks, and photo views. Fetch the most recent reviews, average rating, response rate. " +
        "If the toolset exposes posts and photos audits, summarize freshness and engagement. " +
        "Sections: (1) profile health snapshot, (2) discovery vs direct search trend, (3) actions taken (calls/directions/website), " +
        "(4) reviews summary with response-rate callout and 3-5 representative quotes, " +
        "(5) photos & posts freshness audit, (6) recommended next actions for the local SEO team.",
    ),
    semanticTags: ["google business profile","gbp","local seo","reviews","map pack","local rankings","discovery search"],
  },
  {
    slug: "quarterly-executive-summary",
    title: "Quarterly SEO Executive Summary",
    description: "High-level quarterly report for leadership or clients - KPIs, narrative, and strategic recommendations.",
    category: "seo-report",
    requiredConnections: ["gsc", "ga4"],
    sortOrder: 80,
    questions: [
      "Which client or property?",
      "Which quarter? (e.g. Q1 2026 - I'll resolve the date range)",
      "Compare against the previous quarter, the same quarter last year, or both?",
      "What were the strategic goals for this quarter?",
      "Any wins or risks the leadership team should know about?",
    ],
    body: wrap(
      "Quarterly SEO Executive Summary",
      [
        "Which client or property?",
        "Which quarter? (e.g. Q1 2026 - I'll resolve the date range)",
        "Compare against the previous quarter, the same quarter last year, or both?",
        "What were the strategic goals for this quarter?",
        "Any wins or risks the leadership team should know about?",
      ],
      "Pull GSC and GA4 data for the chosen quarter and the comparison window(s). " +
        "Headline metrics to report: clicks, impressions, average position, CTR, sessions, engaged sessions, conversions, conversion rate. " +
        "Sections: (1) Executive summary (3-5 sentences, plain-English, written for a non-technical reader), " +
        "(2) Quarterly KPI scorecard (cards with current value, prior-period delta, YoY delta), " +
        "(3) What worked - top wins with the data behind them, (4) What slipped - declines with hypothesized cause, " +
        "(5) AI visibility callout (cite the AI Traffic Analysis section), " +
        "(6) Strategic recommendations for next quarter (3-5 prioritized initiatives, each with expected impact and effort).",
    ),
    semanticTags: ["executive summary","quarterly report","leadership","kpi","strategic recommendations","yoy"],
  },
];
