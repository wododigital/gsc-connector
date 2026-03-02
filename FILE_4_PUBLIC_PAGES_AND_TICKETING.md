# FILE 4 of 4: Public Pages & User Ticketing System

## OVERVIEW

Public-facing pages (no auth required): FAQ, Benefits/Features, Integration Setup Guides. Plus user-facing support ticket system (auth required). These pages serve as marketing, onboarding, and self-service support.

## CRITICAL RULES

1. Never use em dashes. Use hyphens instead.
2. Public pages should be server-rendered (no "use client" unless interactive).
3. Public pages need good SEO - proper meta tags, headings, and structured content.
4. Keep the same dark theme aesthetic as admin panel (gray-950 background).
5. All public pages go under `src/app/(public)/` using a route group.
6. User ticket pages go under `src/app/dashboard/tickets/`.

---

## 1. PUBLIC LAYOUT

Create `src/app/(public)/layout.tsx`:

```tsx
import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <header className="border-b border-gray-800/50 sticky top-0 bg-gray-950/80 backdrop-blur-md z-50">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* Replace with your actual logo */}
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              OMG AI
            </span>
            <span className="text-xs text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">
              GSC Connect
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link>
            <Link href="/guides" className="text-gray-400 hover:text-white transition-colors">Guides</Link>
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      {children}

      {/* Footer */}
      <footer className="border-t border-gray-800/50 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">OMG AI</h3>
              <p className="text-sm text-gray-500">
                Connect Google Search Console and Analytics to AI assistants like Claude and ChatGPT.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="text-gray-500 hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-500 hover:text-white">Pricing</Link></li>
                <li><Link href="/guides" className="text-gray-500 hover:text-white">Setup Guides</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" className="text-gray-500 hover:text-white">FAQ</Link></li>
                <li><Link href="/dashboard/tickets" className="text-gray-500 hover:text-white">Contact Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-gray-500 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-500 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800/50 mt-8 pt-8 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} OMG AI by WODO Digital. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
```

---

## 2. FEATURES / BENEFITS PAGE

Create `src/app/(public)/features/page.tsx`:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features - OMG AI GSC Connect',
  description: 'Connect Google Search Console and Google Analytics 4 to Claude, ChatGPT, and other AI assistants. Analyze SEO data through natural conversation.',
};

export default function FeaturesPage() {
  const features = [
    {
      category: 'Google Search Console',
      icon: '🔍',
      items: [
        {
          title: 'Search Performance Analytics',
          description: 'Get clicks, impressions, CTR, and average position data with flexible date ranges. Filter by query, page, country, or device.',
        },
        {
          title: 'Top Keywords & Pages',
          description: 'Instantly identify your best performing content and highest-traffic keywords. Sort by clicks, impressions, CTR, or position.',
        },
        {
          title: 'Page-Level Keyword Analysis',
          description: 'See exactly which search queries drive traffic to any specific page on your site.',
        },
        {
          title: 'URL Inspection',
          description: 'Check indexing status of any URL. Find out if Google can see your pages and identify crawl issues.',
        },
        {
          title: 'Sitemap Management',
          description: 'List, submit, inspect, and manage your XML sitemaps directly through conversation.',
        },
        {
          title: 'Mobile-Friendly Testing',
          description: 'Test any URL for mobile-friendliness and get actionable recommendations.',
        },
      ]
    },
    {
      category: 'Google Analytics 4',
      icon: '📊',
      items: [
        {
          title: 'Traffic Overview',
          description: 'Sessions, users, pageviews, bounce rate, and session duration at a glance.',
        },
        {
          title: 'Audience Demographics',
          description: 'Understand your visitors by country, city, language, device, browser, and operating system.',
        },
        {
          title: 'Traffic Source Analysis',
          description: 'Break down traffic by channel, source, medium, and campaign to see what is working.',
        },
        {
          title: 'Page Performance',
          description: 'Top landing pages, exit pages, and engagement metrics for every page on your site.',
        },
        {
          title: 'Event Tracking',
          description: 'Analyze custom events, conversions, and user interactions across your site.',
        },
        {
          title: 'Real-Time Reporting',
          description: 'See active users and what they are doing on your site right now.',
        },
      ]
    },
    {
      category: 'AI Integration',
      icon: '🤖',
      items: [
        {
          title: 'Works with Claude',
          description: 'Native MCP integration with Claude.ai. Just connect and start asking questions about your data.',
        },
        {
          title: 'Works with ChatGPT',
          description: 'OpenAPI-compatible endpoints let you connect to ChatGPT and other AI assistants.',
        },
        {
          title: 'Natural Language Queries',
          description: 'Ask questions in plain English. "Which pages lost traffic last month?" or "What keywords should I target?"',
        },
        {
          title: 'Multi-Property Support',
          description: 'Manage multiple websites and GA4 properties from a single connection. Perfect for agencies.',
        },
      ]
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">
          Your SEO data, powered by AI
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Connect Google Search Console and Analytics 4 to your favorite AI assistant.
          Ask questions in plain English. Get instant insights. No dashboards to learn.
        </p>
      </div>

      {/* Feature Sections */}
      <div className="space-y-20">
        {features.map(section => (
          <div key={section.category}>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">{section.icon}</span>
              <h2 className="text-2xl font-bold text-white">{section.category}</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {section.items.map(item => (
                <div key={item.title} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-gray-800 rounded-2xl p-12">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to connect your data?</h2>
        <p className="text-gray-400 mb-6">Get started for free with 200 tool calls per month.</p>
        <a
          href="/dashboard"
          className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          Get Started Free
        </a>
      </div>
    </div>
  );
}
```

---

## 3. FAQ PAGE

Create `src/app/(public)/faq/page.tsx`:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - OMG AI GSC Connect',
  description: 'Frequently asked questions about OMG AI GSC Connect. Learn about setup, pricing, security, and supported features.',
};

export default function FAQPage() {
  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'What is OMG AI GSC Connect?',
          a: 'OMG AI GSC Connect is a bridge between your Google Search Console and Google Analytics 4 data and AI assistants like Claude and ChatGPT. It lets you query your SEO and analytics data using natural language instead of navigating complex dashboards.',
        },
        {
          q: 'How do I set it up?',
          a: 'Sign in with your Google account, select which properties you want to connect, then add the connection to Claude or ChatGPT. The whole process takes under 2 minutes. Check our Setup Guides for step-by-step instructions.',
        },
        {
          q: 'Which AI assistants are supported?',
          a: 'Currently we support Claude (via MCP - Model Context Protocol) and ChatGPT (via OpenAPI endpoints). Any AI tool that supports MCP or OpenAPI specifications can also connect.',
        },
        {
          q: 'Do I need to install anything?',
          a: 'No. OMG AI GSC Connect is entirely web-based. You connect through your browser and the AI integration works through standard protocols. No downloads, no plugins, no extensions.',
        },
      ]
    },
    {
      category: 'Security & Privacy',
      questions: [
        {
          q: 'Is my data safe?',
          a: 'Yes. We use Google OAuth 2.0 for authentication. We never see or store your Google password. Your data is encrypted in transit and at rest. We only access the specific Google APIs you authorize.',
        },
        {
          q: 'What permissions do you need?',
          a: 'For Google Search Console, we request read-only access to your search performance data. For Google Analytics 4, we request read-only access to your analytics reports. We never modify your data or settings.',
        },
        {
          q: 'Can I revoke access?',
          a: 'Yes, at any time. You can disconnect from your dashboard or revoke access directly from your Google Account settings at myaccount.google.com/permissions.',
        },
        {
          q: 'Do you share my data with third parties?',
          a: 'No. Your data is only used to serve your requests through the AI assistant. We do not sell, share, or use your data for advertising or training AI models.',
        },
      ]
    },
    {
      category: 'Pricing & Billing',
      questions: [
        {
          q: 'Is there a free plan?',
          a: 'Yes. The free plan includes 200 tool calls per month, access to both GSC and GA4 data, and one Google account. No credit card required.',
        },
        {
          q: 'What counts as a tool call?',
          a: 'Every time the AI assistant queries your data through our connector, that is one tool call. For example, asking "What are my top keywords?" triggers one tool call. Asking "Compare my top keywords vs top pages" would trigger two calls.',
        },
        {
          q: 'What happens if I hit my limit?',
          a: 'You will get a friendly message saying you have reached your monthly limit with an option to upgrade. Your data and settings remain intact. The counter resets at the start of each billing period.',
        },
        {
          q: 'Can I change plans anytime?',
          a: 'Yes. You can upgrade or downgrade at any time from your billing dashboard. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.',
        },
        {
          q: 'Do you offer refunds?',
          a: 'Yes. If you are not satisfied within the first 14 days of a paid subscription, contact us for a full refund.',
        },
      ]
    },
    {
      category: 'Troubleshooting',
      questions: [
        {
          q: 'My properties are not showing up',
          a: 'Make sure you have verified ownership of your properties in Google Search Console. After connecting, go to your dashboard and check the property list. You may need to reconnect if you added new properties after initial setup.',
        },
        {
          q: 'I am getting "insufficient scope" errors',
          a: 'This means your connection needs updated permissions. Go to your dashboard and click "Reconnect" to re-authorize with the required scopes. This commonly happens when GA4 features are added.',
        },
        {
          q: 'Data seems outdated or missing',
          a: 'Google Search Console data has a 2-3 day delay by design. This is a Google limitation, not ours. GA4 data is typically available within a few hours. If data is missing entirely, check that the property is active in your dashboard.',
        },
        {
          q: 'How do I contact support?',
          a: 'Log into your dashboard and open a support ticket. We typically respond within 24 hours. For urgent connection issues, mark the ticket as "Connection Error" for priority handling.',
        },
      ]
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-400">Everything you need to know about OMG AI GSC Connect.</p>
      </div>

      <div className="space-y-12">
        {faqs.map(section => (
          <div key={section.category}>
            <h2 className="text-xl font-bold text-white mb-6 pb-2 border-b border-gray-800">
              {section.category}
            </h2>
            <div className="space-y-6">
              {section.questions.map((faq, i) => (
                <div key={i}>
                  <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Still have questions? */}
      <div className="mt-16 text-center bg-gray-900 border border-gray-800 rounded-lg p-8">
        <h2 className="text-lg font-semibold text-white mb-2">Still have questions?</h2>
        <p className="text-gray-400 text-sm mb-4">Our support team is here to help.</p>
        <a
          href="/dashboard/tickets"
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
```

---

## 4. INTEGRATION SETUP GUIDES PAGE

Create `src/app/(public)/guides/page.tsx`:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Setup Guides - OMG AI GSC Connect',
  description: 'Step-by-step guides to connect Google Search Console and Analytics to Claude and ChatGPT.',
};

export default function GuidesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Setup Guides</h1>
        <p className="text-gray-400">Get connected in under 2 minutes.</p>
      </div>

      {/* Guide 1: Claude MCP */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 bg-orange-900/30 border border-orange-800/30 rounded-lg flex items-center justify-center text-lg">C</span>
          <h2 className="text-2xl font-bold text-white">Connect to Claude (MCP)</h2>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800">
          <GuideStep
            number={1}
            title="Sign in to OMG AI"
            description="Go to the dashboard and sign in with your Google account. This is the same Google account that has access to your Search Console and Analytics properties."
          />
          <GuideStep
            number={2}
            title="Select your properties"
            description="After authorization, you will see a list of all your Google Search Console properties and GA4 properties. Check the ones you want to connect to Claude. You can change this later from your dashboard."
          />
          <GuideStep
            number={3}
            title="Copy the MCP connection URL"
            description="On your dashboard, you will see a connection URL that looks like: https://yourdomain.com/mcp. Copy this URL."
          />
          <GuideStep
            number={4}
            title="Add to Claude"
            description='In Claude.ai, go to Settings (click your name in the bottom-left). Navigate to "Integrations" or "MCP Servers". Click "Add MCP Server" and paste your connection URL. Give it a name like "GSC Connect".'
          />
          <GuideStep
            number={5}
            title="Start querying"
            description='Open a new conversation with Claude and try: "Show me my top 10 keywords from the last 7 days." Claude now has access to your GSC and GA4 data through the connected tools.'
          />
        </div>

        <div className="mt-4 bg-blue-900/10 border border-blue-800/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>Tip:</strong> Claude will show you which tools are available when you start a conversation.
            You should see tools like get_top_keywords, get_search_analytics, get_top_pages, and more.
          </p>
        </div>
      </section>

      {/* Guide 2: ChatGPT */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 bg-green-900/30 border border-green-800/30 rounded-lg flex items-center justify-center text-lg">G</span>
          <h2 className="text-2xl font-bold text-white">Connect to ChatGPT</h2>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800">
          <GuideStep
            number={1}
            title="Sign in to OMG AI"
            description="Same as Claude setup. Go to the dashboard, sign in with Google, and select your properties."
          />
          <GuideStep
            number={2}
            title="Get your OpenAPI spec URL"
            description="From your dashboard, find the ChatGPT integration section. Copy the OpenAPI specification URL."
          />
          <GuideStep
            number={3}
            title="Create a Custom GPT"
            description="In ChatGPT, go to Explore GPTs and click Create. In the Configure tab, scroll down to Actions and click Add Action."
          />
          <GuideStep
            number={4}
            title="Import the schema"
            description="Click Import from URL and paste your OpenAPI spec URL. ChatGPT will load all available actions automatically."
          />
          <GuideStep
            number={5}
            title="Set up authentication"
            description='Under Authentication, select "API Key" and enter your API key from the OMG AI dashboard. Set the Auth Type to "Bearer".'
          />
          <GuideStep
            number={6}
            title="Save and test"
            description='Save your Custom GPT and try asking: "What are my top performing pages this month?"'
          />
        </div>
      </section>

      {/* Guide 3: Managing Properties */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 bg-purple-900/30 border border-purple-800/30 rounded-lg flex items-center justify-center text-lg">&#9881;</span>
          <h2 className="text-2xl font-bold text-white">Managing Your Properties</h2>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800">
          <GuideStep
            number={1}
            title="Adding new properties"
            description="If you add new sites to Google Search Console after initial setup, go to your OMG AI dashboard and click Reconnect. The new properties will appear in your list."
          />
          <GuideStep
            number={2}
            title="Enabling GA4"
            description='If you initially connected only GSC, you can add GA4 by clicking "Reconnect" on your dashboard. This will ask for additional permissions to access your Analytics data.'
          />
          <GuideStep
            number={3}
            title="Toggling properties"
            description="You can enable or disable individual properties from your dashboard without disconnecting. Only active properties are accessible to your AI assistant."
          />
          <GuideStep
            number={4}
            title="Revoking access"
            description="To completely remove access, go to your Google Account settings (myaccount.google.com/permissions), find OMG AI, and click Remove Access. Then delete the connection from your AI assistant."
          />
        </div>
      </section>

      {/* Example Queries */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Example Queries to Try</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            "What are my top 10 keywords by clicks?",
            "Show me pages that lost traffic this month vs last month",
            "Which countries drive the most impressions?",
            "Check if my sitemap is submitted",
            "Is example.com/blog indexed by Google?",
            "What is my average position for 'brand name' queries?",
            "Show me my GA4 traffic sources breakdown",
            "How many mobile vs desktop users visited this week?",
            "What are my top landing pages by sessions?",
            "Compare my CTR across different device types",
          ].map((query, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-300 font-mono">"{query}"</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function GuideStep({ number, title, description }: {
  number: number; title: string; description: string;
}) {
  return (
    <div className="flex gap-4 p-5">
      <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
        {number}
      </span>
      <div>
        <h3 className="font-medium text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
```

---

## 5. PRICING PAGE

Create `src/app/(public)/pricing/page.tsx`:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - OMG AI GSC Connect',
  description: 'Simple, transparent pricing. Start free with 200 tool calls per month.',
};

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying things out',
      features: [
        '200 tool calls per month',
        'Google Search Console access',
        'Google Analytics 4 access',
        'Single Google account',
        'Community support',
      ],
      cta: 'Get Started',
      ctaHref: '/dashboard',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      description: 'For marketers and site owners',
      features: [
        '1,000 tool calls per month',
        'Google Search Console access',
        'Google Analytics 4 access',
        'Up to 3 Google accounts',
        'Priority support',
        'Overage: $10 per 1,000 extra calls',
      ],
      cta: 'Start Pro',
      ctaHref: '/dashboard/billing',
      highlighted: true,
    },
    {
      name: 'Premium',
      price: '$49',
      period: '/month',
      description: 'For agencies and power users',
      features: [
        '5,000 tool calls per month',
        'Google Search Console access',
        'Google Analytics 4 access',
        'Unlimited Google accounts',
        'Priority support',
        'Early access to new integrations',
        'Overage: $8 per 1,000 extra calls',
      ],
      cta: 'Start Premium',
      ctaHref: '/dashboard/billing',
      highlighted: false,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Simple, transparent pricing</h1>
        <p className="text-lg text-gray-400">Start free. Upgrade when you need more.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.name}
            className={`rounded-xl p-6 ${
              plan.highlighted
                ? 'bg-gradient-to-b from-blue-900/30 to-gray-900 border-2 border-blue-500 relative'
                : 'bg-gray-900 border border-gray-800'
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                Most Popular
              </span>
            )}
            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-white">{plan.price}</span>
              <span className="text-gray-400 text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-green-400 mt-0.5 shrink-0">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href={plan.ctaHref}
              className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                plan.highlighted
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }`}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>

      {/* FAQ teaser */}
      <div className="text-center mt-12">
        <p className="text-gray-500 text-sm">
          Have questions? Check our <a href="/faq" className="text-blue-400 hover:text-blue-300">FAQ</a> or{' '}
          <a href="/dashboard/tickets" className="text-blue-400 hover:text-blue-300">contact support</a>.
        </p>
      </div>
    </div>
  );
}
```

---

## 6. USER SUPPORT TICKET SYSTEM

### 6a. Ticket List Page

Create `src/app/dashboard/tickets/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTickets = async () => {
    const res = await fetch('/api/tickets');
    const data = await res.json();
    setTickets(data.tickets || []);
  };

  useEffect(() => { fetchTickets(); }, []);

  const submitTicket = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setShowCreate(false);
      setForm({ subject: '', description: '', category: 'general' });
      setSuccessMsg('Ticket submitted! We typically respond within 24 hours.');
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchTickets();
    }
    setSubmitting(false);
  };

  const statusColors: Record<string, string> = {
    open: 'bg-blue-900/50 text-blue-300',
    in_progress: 'bg-yellow-900/50 text-yellow-300',
    resolved: 'bg-green-900/50 text-green-300',
    closed: 'bg-gray-800 text-gray-500',
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
        >
          New Ticket
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-green-300 text-sm">
          {successMsg}
        </div>
      )}

      {/* Create Ticket Form */}
      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Create a Support Ticket</h2>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="general">General Question</option>
              <option value="connection_error">Connection Error</option>
              <option value="billing">Billing Issue</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              placeholder="Brief summary of your issue"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
                         placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or screenshots if applicable."
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
                         placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-gray-400 hover:text-white text-sm"
            >
              Cancel
            </button>
            <button
              onClick={submitTicket}
              disabled={submitting || !form.subject.trim() || !form.description.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="space-y-3">
        {tickets.map(ticket => (
          <a
            key={ticket.id}
            href={`/dashboard/tickets/${ticket.id}`}
            className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-white">{ticket.subject}</h3>
              <span className={`px-2 py-0.5 rounded text-xs ${statusColors[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{ticket.category.replace('_', ' ')}</span>
              <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
              {ticket.updated_at !== ticket.created_at && (
                <span>Updated {new Date(ticket.updated_at).toLocaleDateString()}</span>
              )}
            </div>
          </a>
        ))}

        {tickets.length === 0 && !showCreate && (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No support tickets yet</p>
            <p className="text-sm">Click "New Ticket" to create one if you need help.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6b. Single Ticket View (Conversation Thread)

Create `src/app/dashboard/tickets/[ticketId]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface TicketMessage {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTicket = async () => {
    const res = await fetch(`/api/tickets/${ticketId}`);
    if (res.status === 404) {
      router.push('/dashboard/tickets');
      return;
    }
    const data = await res.json();
    setTicket(data.ticket);
    setMessages(data.messages || []);
    setLoading(false);
  };

  useEffect(() => { fetchTicket(); }, [ticketId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await fetch(`/api/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessage }),
    });
    setNewMessage('');
    fetchTicket();
  };

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!ticket) return null;

  const statusColors: Record<string, string> = {
    open: 'bg-blue-900/50 text-blue-300',
    in_progress: 'bg-yellow-900/50 text-yellow-300',
    resolved: 'bg-green-900/50 text-green-300',
    closed: 'bg-gray-800 text-gray-500',
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Back link */}
      <a href="/dashboard/tickets" className="text-sm text-gray-500 hover:text-white">
        &#8592; Back to tickets
      </a>

      {/* Ticket Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
          <span className={`px-2 py-1 rounded text-xs ${statusColors[ticket.status]}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>Category: {ticket.category.replace('_', ' ')}</span>
          <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`rounded-lg p-4 ${
              msg.sender_type === 'admin'
                ? 'bg-blue-900/10 border border-blue-800/30 ml-8'
                : 'bg-gray-900 border border-gray-800 mr-8'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${
                msg.sender_type === 'admin' ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {msg.sender_type === 'admin' ? 'Support Team' : 'You'}
              </span>
              <span className="text-xs text-gray-600">
                {new Date(msg.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-200 whitespace-pre-wrap">{msg.message}</p>
          </div>
        ))}
      </div>

      {/* Reply Box */}
      {ticket.status !== 'closed' ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type your reply..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
                       placeholder-gray-500 resize-none mb-3 focus:outline-none focus:border-blue-500"
          />
          <div className="flex justify-end">
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Reply
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          This ticket is closed. <a href="/dashboard/tickets" className="text-blue-400">Open a new ticket</a> if you need further help.
        </div>
      )}
    </div>
  );
}
```

---

## 7. FILE STRUCTURE SUMMARY

New files:

```
src/app/
  (public)/
    layout.tsx                          -- Public layout with nav + footer
    features/page.tsx                   -- Features/benefits page
    faq/page.tsx                        -- FAQ page
    guides/page.tsx                     -- Integration setup guides
    pricing/page.tsx                    -- Pricing page
  dashboard/
    tickets/
      page.tsx                          -- User ticket list + create form
      [ticketId]/page.tsx               -- Single ticket conversation view
```

---

## 8. SEO OPTIMIZATION NOTES

For each public page, the `metadata` export handles basic SEO. For further optimization:

1. Add `robots.txt` at `src/app/robots.ts`:
```typescript
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/dashboard'] },
    sitemap: 'https://yourdomain.com/sitemap.xml',
  };
}
```

2. Add `sitemap.xml` at `src/app/sitemap.ts`:
```typescript
export default function sitemap() {
  const baseUrl = 'https://yourdomain.com';
  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/features`, lastModified: new Date() },
    { url: `${baseUrl}/faq`, lastModified: new Date() },
    { url: `${baseUrl}/guides`, lastModified: new Date() },
    { url: `${baseUrl}/pricing`, lastModified: new Date() },
  ];
}
```

---

## 9. TESTING CHECKLIST

- [ ] Public nav links work (Features, FAQ, Guides, Pricing)
- [ ] Features page renders all three sections (GSC, GA4, AI Integration)
- [ ] FAQ page displays all categories and Q&As
- [ ] Guides page shows step-by-step for Claude, ChatGPT, and property management
- [ ] Pricing page shows all three plans with correct prices
- [ ] Footer renders with correct links and copyright
- [ ] User can create a support ticket (requires login)
- [ ] Ticket list shows all user's tickets with status badges
- [ ] Clicking a ticket opens the conversation thread
- [ ] User can send replies on open tickets
- [ ] Closed tickets show "ticket is closed" message
- [ ] Connection error tickets auto-set to high priority
- [ ] Ticket creation triggers admin notification (verify in admin panel)
- [ ] robots.txt blocks /admin, /api, /dashboard from search engines
- [ ] Meta titles and descriptions appear correctly
- [ ] All pages render in dark theme consistently
- [ ] No em dashes appear anywhere in any content
