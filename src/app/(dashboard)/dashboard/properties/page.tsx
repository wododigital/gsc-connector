import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import { PropertyManager } from "@/components/property-manager";
import { GA4PropertyManager } from "@/components/ga4-property-manager";
import { PropertiesTabs, type PropertyTabKey } from "./properties-tabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties - OMG Bridge",
};

/* ────────────────────────────────────────────────────────────
 * Data loaders - mirror the patterns in dashboard/page.tsx so a
 * single DB hiccup never blanks out the page.
 * ──────────────────────────────────────────────────────────── */
async function getGscProperties(userId: string) {
  try {
    return await db.gscProperty.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, siteUrl: true, permissionLevel: true, isActive: true },
    });
  } catch {
    return [];
  }
}

async function getGa4Properties(userId: string) {
  try {
    return await db.ga4Property.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        propertyId: true,
        displayName: true,
        accountName: true,
        isActive: true,
      },
    });
  } catch {
    return [];
  }
}

/* ────────────────────────────────────────────────────────────
 * Empty-state pane for services we don't ingest yet (GBP, Ads).
 * Matches the dashed-border placeholder pattern from the demo.
 * ──────────────────────────────────────────────────────────── */
function EmptyServicePane({
  service,
  copy,
  comingSoon = false,
}: {
  service: string;
  copy: string;
  comingSoon?: boolean;
}) {
  return (
    <div
      style={{
        padding: "64px",
        textAlign: "center",
        background: "var(--surface-1)",
        border: "1px dashed var(--rule-strong)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontWeight: 700,
          fontSize: 24,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          marginBottom: 8,
        }}
      >
        {comingSoon ? `${service} · Coming soon` : `No ${service} connected`}
      </div>
      <p
        style={{
          color: "var(--ink-2)",
          fontSize: 13,
          maxWidth: 400,
          margin: "0 auto 24px",
        }}
      >
        {copy}
      </p>
      {comingSoon ? (
        <span
          className="pill info"
          style={{ fontSize: 11, padding: "5px 12px" }}
        >
          Coming soon
        </span>
      ) : (
        <Link className="btn btn-primary" href="/onboarding">
          + CONNECT
        </Link>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────── */
export default async function PropertiesPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const [gscProperties, ga4Properties] = await Promise.all([
    getGscProperties(session.id),
    getGa4Properties(session.id),
  ]);

  const tabs: { key: PropertyTabKey; label: string; count: number }[] = [
    { key: "ga4", label: "GA4", count: ga4Properties.length },
    { key: "gsc", label: "Search Console", count: gscProperties.length },
    { key: "gbp", label: "Business Profile", count: 0 },
    { key: "ads", label: "Ads", count: 0 },
  ];

  // Default to whichever connected source the user has the most of, falling
  // back to GA4 so the page never opens onto an empty placeholder when real
  // data is available.
  const initial: PropertyTabKey =
    ga4Properties.length >= gscProperties.length && ga4Properties.length > 0
      ? "ga4"
      : gscProperties.length > 0
        ? "gsc"
        : "ga4";

  const ga4Pane =
    ga4Properties.length > 0 ? (
      <GA4PropertyManager properties={ga4Properties} />
    ) : (
      <EmptyServicePane
        service="GA4 properties"
        copy="Connect Google Analytics 4 to query traffic, conversions, audiences and event performance for any property you manage."
      />
    );

  const gscPane =
    gscProperties.length > 0 ? (
      <PropertyManager properties={gscProperties} />
    ) : (
      <EmptyServicePane
        service="Search Console properties"
        copy="Connect Google Search Console to query keywords, impressions, clicks and indexation status for any verified site you own."
      />
    );

  const gbpPane = (
    <div
      style={{
        padding: "64px",
        textAlign: "center",
        background: "var(--surface-1)",
        border: "1px dashed var(--rule-strong)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontWeight: 700,
          fontSize: 24,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          marginBottom: 8,
        }}
      >
        Business Profile is live
      </div>
      <p
        style={{
          color: "var(--ink-2)",
          fontSize: 13,
          maxWidth: 460,
          margin: "0 auto 24px",
        }}
      >
        Reviews, calls, direction requests, search keywords and post performance for any locations you manage. Existing users need to reconnect Google once so we can add Business Profile access to your stored token. New scope: business.manage.
      </p>
      <a className="btn btn-primary" href="/api/gsc/connect">
        Reconnect Google →
      </a>
    </div>
  );

  const adsPane = (
    <EmptyServicePane
      comingSoon
      service="Google Ads"
      copy="Campaigns, spend, ROAS and keyword bids from any Ads accounts you manage. Landing soon."
    />
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            What your AI <span className="accent">can see.</span>
          </h1>
          <p className="lede">
            Toggle which Google properties are active for your AI assistants.
            Hidden properties stay private. Changes take effect within 30 seconds.
          </p>
        </div>
        <div className="actions">
          <a href="/api/gsc/connect" className="btn">
            Reconnect ↺
          </a>
        </div>
      </div>

      <PropertiesTabs
        tabs={tabs}
        initial={initial}
        panes={{
          ga4: ga4Pane,
          gsc: gscPane,
          gbp: gbpPane,
          ads: adsPane,
        }}
      />
    </>
  );
}
