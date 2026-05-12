"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PropertyManager } from "@/components/property-manager";
import { GA4PropertyManager } from "@/components/ga4-property-manager";
import { CopyButton } from "@/components/copy-button";

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

interface Props {
  sessionEmail: string;
  sessionName: string | null;
  hasGoogleConnection: boolean;
  hasAnalyticsScope: boolean;
  gscProperties: GscProperty[];
  ga4Properties: Ga4Property[];
  mcpEndpoint: string;
}

const STEP_NAMES: Record<number, string> = {
  1: "Choose data sources",
  2: "Pick properties",
  3: "Get endpoint",
};

const TOTAL_STEPS = 3;

export function OnboardingClient(props: Props) {
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const stepFrameRef = useRef<HTMLDivElement | null>(null);
  const isFirstRender = useRef(true);

  // Animated step chip in the topbar — port of the demo's slide animation.
  // We render the new chip with `entering` (offset right + transparent),
  // then on the next double-rAF remove the class to trigger the slide.
  // Old chip gets `exiting` and is removed after the transition.
  useEffect(() => {
    const frame = stepFrameRef.current;
    if (!frame) return;

    const oldContent = frame.querySelector(".step-chip");
    const newContent = document.createElement("div");
    newContent.className = isFirstRender.current ? "step-chip" : "step-chip entering";
    newContent.innerHTML = `<span class="step-chip-num">${String(step).padStart(2, "0")}</span><span class="step-chip-sep">/</span><span class="step-chip-name">${STEP_NAMES[step]}</span>`;
    frame.appendChild(newContent);

    if (oldContent) {
      oldContent.classList.add("exiting");
      const oldEl = oldContent;
      window.setTimeout(() => oldEl.remove(), 420);
    }

    if (!isFirstRender.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          newContent.classList.remove("entering");
        });
      });
    }
    isFirstRender.current = false;

    return () => {
      // On unmount, clear any leftover chips so we don't leak DOM nodes.
      // (the next mount's effect handles its own cleanup of the previous chip)
    };
  }, [step]);

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

  const goToStep = (n: number) => {
    setStep(n);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const progressPct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="atmosphere min-h-screen bg-bg text-ink">
      {/* Inline styles needed for the animated step chip + step-pane transitions.
          Kept scoped here to avoid touching globals.css. */}
      <style jsx global>{`
        .onb-step-frame {
          position: relative;
          height: 22px;
          min-width: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .step-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          font-size: 11px;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          transition:
            transform 0.42s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.25s ease;
          opacity: 1;
        }
        .step-chip-num {
          font-family: var(--display);
          font-weight: 700;
          font-size: 16px;
          letter-spacing: -0.02em;
          color: var(--vermilion);
          line-height: 1;
        }
        .step-chip-sep {
          color: var(--ink-3);
          font-size: 13px;
        }
        .step-chip-name {
          color: var(--ink);
          font-weight: 500;
          letter-spacing: 0.06em;
        }
        .step-chip.entering {
          transform: translate(calc(-50% + 60px), 0);
          opacity: 0;
        }
        .step-chip.exiting {
          transform: translate(calc(-50% - 60px), 0);
          opacity: 0;
        }
        .onb-progress {
          width: 240px;
          height: 2px;
          background: var(--rule);
          position: relative;
          overflow: hidden;
        }
        .onb-progress-bar {
          height: 100%;
          background: var(--vermilion);
          transition: width 0.42s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 720px) {
          .onb-step-frame {
            min-width: 180px;
          }
          .onb-progress {
            width: 160px;
          }
        }
      `}</style>

      {/* ─── Topbar: logo · animated step chip + progress · sign out ─────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 grid items-center px-6 py-3.5 backdrop-blur-md"
        style={{
          gridTemplateColumns: "auto 1fr auto",
          minHeight: 64,
          borderBottom: "1px solid var(--teal)",
          background: "rgba(10,16,24,0.92)",
        }}
      >
        <Link href="/" className="block">
          <Image
            src="/omg-logo-light.webp"
            alt="OMG / BRIDGE"
            width={140}
            height={28}
            priority
            className="h-7 w-auto block"
          />
        </Link>
        <div className="flex flex-col items-center gap-2">
          <div ref={stepFrameRef} className="onb-step-frame" />
          <div className="onb-progress">
            <div className="onb-progress-bar" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <a
          href="/api/auth/logout"
          className="text-ink-2 no-underline transition-colors hover:text-vermilion"
          style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase" }}
        >
          SIGN OUT
        </a>
      </header>

      {/* ─── Shell ──────────────────────────────────────────────────────── */}
      <main
        className="relative z-10 mx-auto"
        style={{
          maxWidth: 920,
          padding: "48px 32px 140px",
          paddingTop: 113,
          minHeight: "calc(100vh - 65px)",
        }}
      >
        {step === 1 && (
          <ConnectStep
            sessionEmail={props.sessionEmail}
            hasGoogleConnection={props.hasGoogleConnection}
            hasAnalyticsScope={props.hasAnalyticsScope}
          />
        )}
        {step === 2 && (
          <PropertiesStep
            gscProperties={props.gscProperties}
            ga4Properties={props.ga4Properties}
            hasAnalyticsScope={props.hasAnalyticsScope}
          />
        )}
        {step === 3 && (
          <EndpointStep
            mcpEndpoint={props.mcpEndpoint}
            error={error}
          />
        )}
      </main>

      {/* ─── Sticky bottom step nav ─────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md"
        style={{
          padding: "14px 32px",
          background: "rgba(10,16,24,0.94)",
          borderTop: "1px solid var(--rule-strong)",
        }}
      >
        <div className="flex items-center gap-2.5">
          {step === 1 ? (
            <span
              className="text-ink-3 hidden sm:inline"
              style={{ fontSize: 12, letterSpacing: "0.04em" }}
            >
              Toggle on what you need. You can change this later.
            </span>
          ) : (
            <button onClick={() => goToStep(step - 1)} className="btn btn-ghost">
              ← Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {step < 3 && (
            <button
              onClick={() => goToStep(step + 1)}
              className="btn btn-primary"
              disabled={
                step === 2 &&
                !props.gscProperties.some((p) => p.isActive) &&
                !props.ga4Properties.some((p) => p.isActive)
              }
            >
              Continue →
            </button>
          )}
          {step === 3 && (
            <button onClick={finish} disabled={completing} className="btn btn-primary">
              {completing ? "Finishing..." : "Go to Dashboard →"}
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* STEP 1 — Choose data sources                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function ConnectStep({
  sessionEmail,
  hasGoogleConnection,
  hasAnalyticsScope,
}: {
  sessionEmail: string;
  hasGoogleConnection: boolean;
  hasAnalyticsScope: boolean;
}) {
  // Local "exposure" toggles for each service. These are visual-only for now;
  // the actual scope authorization lives at the OAuth layer (handled when the
  // user connects with /api/gsc/connect). We default to ENABLED for the
  // services the user has authorized, so the cards reflect their grant state.
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    ga4: hasAnalyticsScope,
    gsc: hasGoogleConnection,
    gbp: false,
    ads: false,
  });

  const toggle = (key: string) => setEnabled((e) => ({ ...e, [key]: !e[key] }));

  return (
    <>
      <h2
        className="font-display"
        style={{
          fontWeight: 700,
          fontSize: "clamp(28px, 3.4vw, 42px)",
          lineHeight: 1.05,
          letterSpacing: "-0.035em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        Pick the Google services{" "}
        <span
          style={{
            textDecoration: "underline",
            textDecorationColor: "var(--teal)",
            textDecorationThickness: 3,
            textUnderlineOffset: 5,
          }}
        >
          to expose.
        </span>
      </h2>
      <p
        className="text-ink-2"
        style={{ fontSize: 15, lineHeight: 1.65, maxWidth: 620, marginBottom: 40 }}
      >
        Toggle which services your AI assistants can query. You can change these
        anytime from the dashboard.
      </p>

      <div style={{ marginBottom: 40 }}>
        {/* Signed-in banner */}
        <div
          className="flex items-center gap-3.5 mb-7 bg-surface-1"
          style={{
            padding: "14px 18px",
            border: "1px solid rgba(0, 181, 181, 0.5)",
            borderLeftWidth: 3,
          }}
        >
          <div
            className="grid place-items-center text-teal flex-shrink-0"
            style={{
              width: 32,
              height: 32,
              border: "1px solid var(--teal)",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            ✓
          </div>
          <div>
            <div className="text-ink" style={{ fontSize: 13.5, marginBottom: 2 }}>
              Signed in as{" "}
              <strong className="text-teal" style={{ fontWeight: 600 }}>
                {sessionEmail}
              </strong>
            </div>
            <div className="text-ink-3" style={{ fontSize: 12, lineHeight: 1.5 }}>
              Your Google account is already authorized.{" "}
              {hasAnalyticsScope
                ? "No need to re-authenticate."
                : "Reconnect below to add Analytics access."}
            </div>
          </div>
        </div>

        {/* Connect cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConnectCard
            name="Google Analytics 4"
            blurb="Query traffic, sessions, conversions, audiences and events from any GA4 property you own."
            scopes={["analytics.readonly", "analytics.reports"]}
            enabled={enabled.ga4}
            onToggle={() => toggle("ga4")}
            grantedTo={enabled.ga4 ? sessionEmail : null}
            warningCta={
              !hasAnalyticsScope
                ? {
                    label: "Reconnect with Analytics access",
                    href: "/api/gsc/connect?return=onboarding",
                  }
                : null
            }
          />
          <ConnectCard
            name="Search Console"
            blurb="Query keywords, rankings, indexation, sitemaps and Core Web Vitals from your verified sites."
            scopes={["webmasters.readonly"]}
            enabled={enabled.gsc}
            onToggle={() => toggle("gsc")}
            grantedTo={enabled.gsc ? sessionEmail : null}
            warningCta={
              !hasGoogleConnection
                ? {
                    label: "Connect Google account",
                    href: "/api/gsc/connect?return=onboarding",
                  }
                : null
            }
          />
          <ConnectCard
            name="Business Profile"
            blurb="Query reviews, calls, direction requests and post performance for any locations you manage."
            scopes={["business.manage"]}
            enabled={enabled.gbp}
            onToggle={() => toggle("gbp")}
            grantedTo={enabled.gbp ? sessionEmail : null}
            comingSoon
          />
          <ConnectCard
            name="Google Ads"
            blurb="Query campaigns, ad spend, ROAS and keyword bids from any Ads accounts you have access to. Optional."
            scopes={["adwords"]}
            enabled={enabled.ads}
            onToggle={() => toggle("ads")}
            grantedTo={enabled.ads ? sessionEmail : null}
            comingSoon
          />
        </div>
      </div>
    </>
  );
}

function ConnectCard({
  name,
  blurb,
  scopes,
  enabled,
  onToggle,
  grantedTo,
  warningCta,
  comingSoon,
}: {
  name: string;
  blurb: string;
  scopes: string[];
  enabled: boolean;
  onToggle: () => void;
  grantedTo: string | null;
  warningCta?: { label: string; href: string } | null;
  comingSoon?: boolean;
}) {
  return (
    <div
      className="flex flex-col transition-colors"
      style={{
        gap: 18,
        background: enabled ? "var(--surface-2)" : "var(--surface-1)",
        border: "1px solid rgba(0, 181, 181, 0.5)",
        padding: 28,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="font-display"
          style={{
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          {name}
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={comingSoon}
          className="flex items-center gap-2.5 select-none"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: comingSoon ? "not-allowed" : "pointer",
            opacity: comingSoon ? 0.5 : 1,
          }}
          aria-pressed={enabled}
          aria-label={`${enabled ? "Disable" : "Enable"} ${name}`}
        >
          <span
            className="relative flex-shrink-0"
            style={{
              width: 36,
              height: 20,
              background: enabled ? "var(--vermilion)" : "var(--surface-3)",
              border: `1px solid ${enabled ? "var(--vermilion)" : "var(--rule-strong)"}`,
              transition: "background .2s, border-color .2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 1,
                left: enabled ? 17 : 1,
                width: 16,
                height: 16,
                background: enabled ? "#fff" : "var(--ink-3)",
                transition: "all .2s",
              }}
            />
          </span>
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: enabled ? "var(--vermilion)" : "var(--ink-3)",
            }}
          >
            {comingSoon ? "SOON" : enabled ? "ENABLED" : "DISABLED"}
          </span>
        </button>
      </div>

      <p className="text-ink-2" style={{ fontSize: 13, lineHeight: 1.6 }}>
        {blurb}
      </p>

      <div className="flex gap-2 flex-wrap">
        {scopes.map((s) => (
          <span
            key={s}
            className="font-mono text-ink-3"
            style={{
              fontSize: 10.5,
              padding: "4px 8px",
              background: "var(--bg)",
              border: "1px solid var(--rule)",
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {enabled && grantedTo && !warningCta && (
        <div
          className="font-mono text-teal"
          style={{
            padding: "10px 12px",
            background: "var(--bg)",
            border: "1px solid var(--rule)",
            fontSize: 11.5,
          }}
        >
          ● Granted to {grantedTo}
        </div>
      )}

      {warningCta && (
        <a
          href={warningCta.href}
          className="block text-center w-full mt-auto no-underline"
          style={{
            padding: "12px 18px",
            background: "var(--ink)",
            color: "var(--bg)",
            fontFamily: "var(--body)",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            transition: "background .18s",
          }}
        >
          {warningCta.label}
        </a>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* STEP 2 — Pick properties                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function PropertiesStep({
  gscProperties,
  ga4Properties,
  hasAnalyticsScope,
}: {
  gscProperties: GscProperty[];
  ga4Properties: Ga4Property[];
  hasAnalyticsScope: boolean;
}) {
  const ga4Active = ga4Properties.filter((p) => p.isActive).length;
  const gscActive = gscProperties.filter((p) => p.isActive).length;

  return (
    <>
      <h2
        className="font-display"
        style={{
          fontWeight: 700,
          fontSize: "clamp(28px, 3.4vw, 42px)",
          lineHeight: 1.05,
          letterSpacing: "-0.035em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        Pick the properties{" "}
        <span className="text-vermilion">your AI can query.</span>
      </h2>
      <p
        className="text-ink-2"
        style={{ fontSize: 15, lineHeight: 1.65, maxWidth: 620, marginBottom: 40 }}
      >
        Toggle the GA4 properties and Search Console sites you want to expose.
        You can change scopes per teammate later.
      </p>

      <div style={{ marginBottom: 40 }}>
        {/* GA4 section — delegates to GA4PropertyManager which handles the
            actual API persistence to /api/ga4/properties. */}
        <section style={{ marginBottom: 32 }}>
          <h3
            className="font-display flex justify-between items-center"
            style={{
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: "1px solid var(--rule)",
            }}
          >
            <span>GA4 Properties</span>
            <span
              className="font-mono text-ink-3"
              style={{ fontSize: 11, fontWeight: 400 }}
            >
              {ga4Active} of {ga4Properties.length} active
            </span>
          </h3>
          {!hasAnalyticsScope ? (
            <p className="text-ink-3" style={{ fontSize: 13 }}>
              Reconnect with Analytics access from the previous step to enable
              GA4 properties.
            </p>
          ) : ga4Properties.length > 0 ? (
            <GA4PropertyManager properties={ga4Properties} />
          ) : (
            <p className="text-ink-3" style={{ fontSize: 13 }}>
              No GA4 properties found.
            </p>
          )}
        </section>

        {/* GSC section — delegates to PropertyManager. */}
        <section>
          <h3
            className="font-display flex justify-between items-center"
            style={{
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: "1px solid var(--rule)",
            }}
          >
            <span>Search Console Sites</span>
            <span
              className="font-mono text-ink-3"
              style={{ fontSize: 11, fontWeight: 400 }}
            >
              {gscActive} of {gscProperties.length} active
            </span>
          </h3>
          {gscProperties.length > 0 ? (
            <PropertyManager properties={gscProperties} />
          ) : (
            <p className="text-ink-3" style={{ fontSize: 13 }}>
              No GSC properties found on this Google account.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* (Brand setup step removed — kept hidden for later restoration)            */
/* ────────────────────────────────────────────────────────────────────────── */
/* STEP 3 — Endpoint                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function EndpointStep({
  mcpEndpoint,
  error,
}: {
  mcpEndpoint: string;
  error: string;
}) {
  return (
    <>
      <h2
        className="font-display"
        style={{
          fontWeight: 700,
          fontSize: "clamp(28px, 3.4vw, 42px)",
          lineHeight: 1.05,
          letterSpacing: "-0.035em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        You&apos;re <span className="text-vermilion">ready.</span> Drop this into any AI.
      </h2>
      <p
        className="text-ink-2"
        style={{ fontSize: 15, lineHeight: 1.65, maxWidth: 620, marginBottom: 40 }}
      >
        Copy your unique MCP endpoint and paste it into Claude Desktop,
        Claude.ai, ChatGPT, Cursor or any MCP-compatible assistant.
      </p>

      <div style={{ marginBottom: 40 }}>
        {/* Endpoint block */}
        <div
          className="bg-surface-1"
          style={{
            border: "1px solid rgba(0, 181, 181, 0.5)",
            marginBottom: 32,
            boxShadow:
              "0 0 0 1px var(--teal-glow), 0 0 40px var(--teal-glow)",
          }}
        >
          <div
            className="flex justify-between items-center text-ink-3"
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--rule)",
              background: "var(--surface-2)",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            <span>YOUR MCP ENDPOINT</span>
            <span className="text-teal">● LIVE · READY TO QUERY</span>
          </div>
          <div
            className="flex items-center justify-between gap-4"
            style={{ padding: "22px 18px" }}
          >
            <code
              className="font-mono text-ink"
              style={{ fontSize: 14.5, flex: 1, wordBreak: "break-all" }}
            >
              {mcpEndpoint}
            </code>
            <CopyButton text={mcpEndpoint} label="COPY ↗" />
          </div>
        </div>

        {/* Setup cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SetupCard
            icon={<ClaudeIcon />}
            title="Claude Desktop"
            steps={[
              "Open Claude Desktop → Settings",
              'Click "Connectors" → "Add Custom"',
              "Paste your endpoint URL",
              "Authorize with Google",
            ]}
          />
          <SetupCard
            icon={<OpenAIIcon />}
            title="ChatGPT"
            steps={[
              "Go to chatgpt.com → Custom GPTs",
              "Create new → Configure → Actions",
              "Import from URL: paste endpoint",
              "Use OAuth, not API key",
            ]}
          />
          <SetupCard
            icon={<CursorIcon />}
            title="Cursor"
            steps={[
              "Open Cursor → Settings → MCP",
              "Add new server",
              'Paste endpoint, name "OMG Bridge"',
              "Restart Cursor",
            ]}
          />
        </div>
      </div>

      {error && (
        <div
          className="text-vermilion"
          style={{
            padding: "12px 16px",
            background: "rgba(255,107,74,0.08)",
            border: "1px solid rgba(255,107,74,0.4)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}
    </>
  );
}

function SetupCard({
  icon,
  title,
  steps,
}: {
  icon: React.ReactNode;
  title: string;
  steps: string[];
}) {
  return (
    <div
      className="flex flex-col bg-surface-1"
      style={{
        gap: 14,
        padding: 24,
        border: "1px solid var(--rule-strong)",
      }}
    >
      <div
        className="grid place-items-center text-teal"
        style={{ width: 32, height: 32 }}
      >
        {icon}
      </div>
      <h4
        className="font-display"
        style={{
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </h4>
      <ol
        className="text-ink-2"
        style={{
          listStyle: "none",
          counterReset: "setup-step",
          fontSize: 12.5,
          lineHeight: 1.6,
          padding: 0,
        }}
      >
        {steps.map((s, i) => (
          <li
            key={i}
            style={{
              counterIncrement: "setup-step",
              padding: "6px 0 6px 26px",
              position: "relative",
            }}
          >
            <span
              aria-hidden
              className="font-mono text-teal grid place-items-center"
              style={{
                position: "absolute",
                left: 0,
                top: 6,
                width: 18,
                height: 18,
                background: "var(--bg)",
                fontSize: 10,
                fontWeight: 600,
                border: "1px solid var(--rule)",
              }}
            >
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Brand SVGs (lifted from the demo)                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function ClaudeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
      <path d="M8.64445 2.55279C8.39746 2.05881 7.79679 1.85859 7.30281 2.10558C6.80883 2.35257 6.60861 2.95324 6.8556 3.44722L9.68128 9.09859L5.06655 5.92596C4.61145 5.61308 3.98887 5.72837 3.67598 6.18348C3.3631 6.63858 3.47839 7.26116 3.9335 7.57405L9.40503 11.3357L3.05258 11.0014C2.50106 10.9724 2.03043 11.3959 2.00141 11.9474C1.97238 12.499 2.39594 12.9696 2.94747 12.9986L8.74187 13.3036L4.44532 16.168C3.9858 16.4743 3.86162 17.0952 4.16797 17.5547C4.47433 18.0142 5.0952 18.1384 5.55473 17.8321L9.19687 15.404L6.68629 18.9188C6.36528 19.3682 6.46937 19.9927 6.91879 20.3137C7.3682 20.6347 7.99275 20.5307 8.31376 20.0812L11.3471 15.8345L10.5136 20.8356C10.4228 21.3804 10.7909 21.8956 11.3356 21.9864C11.8804 22.0772 12.3956 21.7092 12.4864 21.1644L13.2883 16.3532L15.6588 20.0408C15.9575 20.5053 16.5762 20.6398 17.0408 20.3412C17.5054 20.0425 17.6399 19.4238 17.3412 18.9592L15.5553 16.1812L18.3217 18.7348C18.7276 19.1094 19.3602 19.0841 19.7348 18.6783C20.1094 18.2725 20.0841 17.6398 19.6783 17.2652L16.6427 14.4631L20.876 14.9923C21.424 15.0608 21.9238 14.6721 21.9923 14.124C22.0608 13.576 21.6721 13.0762 21.1241 13.0077L16.9342 12.484L21.2291 11.4734C21.7667 11.3469 22.0999 10.8086 21.9734 10.271C21.8469 9.73336 21.3086 9.40009 20.771 9.52659L15.1819 10.8417L19.2863 5.61783C19.6276 5.18356 19.5521 4.5549 19.1178 4.21369C18.6836 3.87247 18.0549 3.94791 17.7137 4.38218L13.8574 9.29015L14.738 3.65438C14.8233 3.10872 14.4501 2.59725 13.9044 2.51199C13.3587 2.42673 12.8473 2.79996 12.762 3.34563L11.876 9.01594L8.64445 2.55279Z" />
    </svg>
  );
}

function OpenAIIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
    </svg>
  );
}

function CursorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
      <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
    </svg>
  );
}
