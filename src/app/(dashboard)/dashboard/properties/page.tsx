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
}: {
  service: string;
  copy: string;
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
        No {service} connected
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
      <Link className="btn btn-primary" href="/onboarding">
        + CONNECT
      </Link>
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
    <EmptyServicePane
      service="Business Profile"
      copy="Connect Google Business Profile to query reviews, calls, direction requests and post performance for any locations you manage."
    />
  );

  const adsPane = (
    <EmptyServicePane
      service="Ads accounts"
      copy="Connect Google Ads to query campaigns, spend, ROAS and keyword bids from any Ads accounts you manage."
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
            Toggle which Google properties are exposed to your AI assistants.
            Hidden properties stay private. Changes take effect within 30 seconds.
          </p>
        </div>
        <div className="actions">
          <a href="/api/gsc/connect" className="btn">
            Reconnect ↺
          </a>
          <Link href="/onboarding" className="btn btn-primary">
            + Add Connection
          </Link>
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
