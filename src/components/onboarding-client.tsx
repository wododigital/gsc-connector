"use client";

import { useState } from "react";
import { PropertyManager } from "@/components/property-manager";
import { GA4PropertyManager } from "@/components/ga4-property-manager";
import { CopyButton } from "@/components/copy-button";
import { BrandingClient } from "@/components/branding-client";

interface GscProperty {
  id: string;
  siteUrl: string;
  permissionLevel: string;
  isActive: boolean;
}

interface Ga4Property {
  id: string;
  propertyId: string;
  displayName: string;
  accountName: string | null;
  isActive: boolean;
}

interface BrandProfile {
  id: string;
  companyName: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  logoUrlDark: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  accentColorDark: string | null;
  fontFamily: string | null;
  reportTheme: string | null;
  reportDos: string | null;
  reportDonts: string | null;
  isApproved: boolean;
}

interface Props {
  hasGoogleConnection: boolean;
  hasAnalyticsScope: boolean;
  gscProperties: GscProperty[];
  ga4Properties: Ga4Property[];
  brandProfile: BrandProfile | null;
  mcpEndpoint: string;
}

const STEPS = [
  { id: 1, label: "Connect" },
  { id: 2, label: "Select Properties" },
  { id: 3, label: "Brand" },
  { id: 4, label: "Endpoint" },
];

export function OnboardingClient(props: Props) {
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  const finish = async () => {
    setCompleting(true);
    setError("");
    const res = await fetch("/api/onboarding/complete", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to complete onboarding");
      setCompleting(false);
      return;
    }
    // Hard nav so the server-side dashboard layout re-runs and reads the
    // fresh `onboardingCompleted` flag (a router.push wouldn't always
    // re-execute the layout's redirect check).
    window.location.href = "/dashboard";
  };

  const skipBrand = () => setStep(4);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--brand-bg, #06080d)" }}>
      <div className="app-background app-background-user" />

      <header className="px-6 md:px-12 py-6 flex items-center justify-between relative z-10">
        <img src="/omg-bridge-logo-dark.svg" alt="OMG Bridge" className="h-7" />
        <a href="/api/auth/logout" className="text-xs" style={{ color: "var(--text-muted)" }}>Sign out</a>
      </header>

      <div className="px-6 md:px-12 pt-2 pb-6 relative z-10">
        <StepIndicator current={step} />
      </div>

      <main className="flex-1 flex items-start justify-center px-4 pb-12 relative z-10">
        <div className="w-full max-w-4xl">
          {step === 1 && (
            <ConnectStep
              hasGoogleConnection={props.hasGoogleConnection}
              hasAnalyticsScope={props.hasAnalyticsScope}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <PropertiesStep
              gscProperties={props.gscProperties}
              ga4Properties={props.ga4Properties}
              hasAnalyticsScope={props.hasAnalyticsScope}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <BrandStep
              brandProfile={props.brandProfile}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              onSkip={skipBrand}
            />
          )}
          {step === 4 && (
            <EndpointStep
              mcpEndpoint={props.mcpEndpoint}
              onBack={() => setStep(3)}
              completing={completing}
              error={error}
              onFinish={finish}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 max-w-3xl mx-auto">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} className="flex items-center gap-2 md:gap-4">
            <div
              className="flex items-center justify-center rounded-full text-xs font-semibold"
              style={{
                width: 28,
                height: 28,
                background: active ? "var(--accent)" : done ? "rgba(0,179,179,0.2)" : "rgba(255,255,255,0.05)",
                color: active ? "#06080d" : done ? "var(--accent-light)" : "var(--text-muted)",
                border: `1px solid ${active || done ? "var(--accent)" : "var(--glass-border)"}`,
              }}
            >
              {done ? "✓" : s.id}
            </div>
            <span className="text-xs hidden md:inline" style={{ color: active ? "var(--text-primary)" : "var(--text-muted)" }}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="hidden md:block" style={{ width: 40, height: 1, background: "var(--glass-border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConnectStep({
  hasGoogleConnection,
  hasAnalyticsScope,
  onNext,
}: {
  hasGoogleConnection: boolean;
  hasAnalyticsScope: boolean;
  onNext: () => void;
}) {
  return (
    <div className="glass-card p-6 md:p-10 text-center">
      <h1 className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        Connect your Google account
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Authorize OMG Bridge to read your Search Console and Analytics 4 data on your behalf.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-4 text-left">
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Google Search Console</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Required for keyword, page, sitemap and URL inspection tools.</p>
        </div>
        <div className="glass-card p-4 text-left">
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Google Analytics 4</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Required for traffic, conversions and channel-mix tools.</p>
        </div>
      </div>

      {hasGoogleConnection && hasAnalyticsScope ? (
        <div className="space-y-3">
          <span className="badge badge-success">Connected</span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>You can move on to property selection.</p>
          <div>
            <button onClick={onNext} className="btn-primary">Continue</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <a href="/api/gsc/connect?return=onboarding" className="btn-primary">
            {hasGoogleConnection ? "Reconnect with Analytics access" : "Connect Google account"}
          </a>
          {hasGoogleConnection && !hasAnalyticsScope && (
            <p className="text-xs" style={{ color: "var(--warning)" }}>
              You connected before GA4 support existed - please reconnect to grant Analytics permission.
            </p>
          )}
          {hasGoogleConnection && (
            <div>
              <button onClick={onNext} className="btn-ghost btn-ghost-sm">Skip for now</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PropertiesStep({
  gscProperties,
  ga4Properties,
  hasAnalyticsScope,
  onBack,
  onNext,
}: {
  gscProperties: GscProperty[];
  ga4Properties: Ga4Property[];
  hasAnalyticsScope: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const canContinue = gscProperties.some((p) => p.isActive) || ga4Properties.some((p) => p.isActive);

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Select active properties</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Toggle which properties your AI tools can access. You can change this later in Dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="glass-card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Google Search Console</h2>
          {gscProperties.length > 0 ? (
            <PropertyManager properties={gscProperties} />
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No GSC properties found on this Google account.</p>
          )}
        </section>

        <section className="glass-card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Google Analytics 4</h2>
          {!hasAnalyticsScope ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Reconnect with Analytics access from the previous step to enable GA4 properties.
            </p>
          ) : ga4Properties.length > 0 ? (
            <GA4PropertyManager properties={ga4Properties} />
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No GA4 properties found.</p>
          )}
        </section>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-ghost btn-ghost-sm">← Back</button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="btn-primary btn-primary-sm"
          title={canContinue ? undefined : "Activate at least one property to continue"}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

const DEMO_REPORTS = [
  { href: "/demo-reports/monthly-seo-demo.html", title: "Monthly SEO Performance", description: "Cards, keyword movement, channel mix." },
  { href: "/demo-reports/traffic-analysis-demo.html", title: "Traffic Source Breakdown", description: "Channel share, source/medium, AI referrals." },
  { href: "/demo-reports/keyword-gap-demo.html", title: "Keyword Gap & Opportunity", description: "Striking-distance, declines, quick wins." },
];

function BrandStep({
  brandProfile,
  onBack,
  onNext,
  onSkip,
}: {
  brandProfile: BrandProfile | null;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-card p-5">
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Your brand, your reports</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Upload your logo and we&apos;ll extract dominant brand colors. Reports generated through the prompt library will be styled accordingly.
          </p>
        </div>
        <BrandingClient initial={brandProfile} embedded />
        <div className="flex justify-between">
          <button onClick={onBack} className="btn-ghost btn-ghost-sm">← Back</button>
          <div className="flex gap-2">
            <button onClick={onSkip} className="btn-ghost btn-ghost-sm">Skip for now</button>
            <button onClick={onNext} className="btn-primary btn-primary-sm">Continue →</button>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Why set up branding?</h2>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            OMG Bridge generates beautiful HTML reports with your data. Branding makes them feel like <em>your</em> reports - your logo, your colors, your typography - so they&apos;re client-ready out of the box.
          </p>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Sample reports</h3>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Click to preview these with OMG Bridge default branding.
          </p>
          <div className="space-y-2">
            {DEMO_REPORTS.map((r) => (
              <a
                key={r.href}
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="block p-3 rounded-lg transition-colors"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.title} →</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{r.description}</p>
              </a>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function EndpointStep({
  mcpEndpoint,
  onBack,
  completing,
  error,
  onFinish,
}: {
  mcpEndpoint: string;
  onBack: () => void;
  completing: boolean;
  error: string;
  onFinish: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="glass-card p-6 md:p-8">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Your MCP endpoint is ready</h1>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Use this URL to connect OMG Bridge to Claude, ChatGPT, Cursor, or any other MCP-compatible AI tool.
        </p>
        <div
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{ background: "rgba(6,10,16,0.6)", border: "1px solid var(--glass-border)" }}
        >
          <code className="flex-1 text-sm font-mono truncate" style={{ color: "var(--accent-light)" }}>
            {mcpEndpoint}
          </code>
          <CopyButton text={mcpEndpoint} label="Copy" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
          <SetupHint title="Claude.ai" steps={["Settings → Integrations", "Add integration", "Paste the URL", "Authorize"]} badge="OAuth - no key" />
          <SetupHint title="ChatGPT" steps={["Settings → Connectors", "Add connector", "Paste the URL", "Authorize"]} badge="OAuth - no key" />
          <SetupHint title="Claude Desktop" steps={["Create an API key in Dashboard → API Keys", "Add to claude_desktop_config.json", "Restart Claude Desktop"]} badge="Needs API key" />
          <SetupHint title="Cursor" steps={["Cursor Settings → MCP", "Add new MCP server (type: http)", "Paste the URL", "Add Authorization header"]} badge="Needs API key" />
        </div>
      </div>

      {error && <div className="glass-card p-3 text-sm" style={{ color: "var(--error)" }}>{error}</div>}

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-ghost btn-ghost-sm">← Back</button>
        <button onClick={onFinish} disabled={completing} className="btn-primary">
          {completing ? "Finishing..." : "Go to Dashboard"}
        </button>
      </div>
    </div>
  );
}

function SetupHint({ title, steps, badge }: { title: string; steps: string[]; badge: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <span className="badge badge-muted" style={{ fontSize: "10px" }}>{badge}</span>
      </div>
      <ol className="text-xs space-y-1 pl-4 list-decimal" style={{ color: "var(--text-secondary)" }}>
        {steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </div>
  );
}
