import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import { PropertyManager } from "@/components/property-manager";
import { GA4PropertyManager } from "@/components/ga4-property-manager";
import { getGbpAccessToken } from "@/lib/gbp/access";
import {
  listGbpAccounts,
  listGbpLocations,
  GbpApiError,
  type GbpAccount,
  type GbpLocation,
} from "@/lib/gbp/api";
import { getGtmAccessToken } from "@/lib/gtm/access";
import {
  listGtmAccounts,
  listGtmContainers,
  GtmApiError,
  type GtmAccount,
  type GtmContainer,
} from "@/lib/gtm/api";
import { getAdsAccessToken } from "@/lib/ads/access";
import { listAccessibleCustomers, adsSearch, AdsApiError } from "@/lib/ads/api";
import { getPlatformAccessMap } from "@/lib/platform-access";
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

async function getCredentialScopes(userId: string) {
  try {
    // Union across ALL credential rows - the platform helpers pick the right
    // credential per scope, so "granted" means any row carries it.
    const credentials = await db.googleCredential.findMany({
      where: { userId },
      select: { scopes: true },
    });
    const allScopes = credentials.map((c) => c.scopes).join(" ");
    return {
      hasCredential: credentials.length > 0,
      hasGbpScope: allScopes.includes("business.manage"),
      hasGtmScope: allScopes.includes("tagmanager"),
      hasAdsScope: allScopes.includes("adwords"),
    };
  } catch {
    return { hasCredential: false, hasGbpScope: false, hasGtmScope: false, hasAdsScope: false };
  }
}

type GbpAccountWithLocations = GbpAccount & { locations: GbpLocation[] };

type GbpStatus =
  | { state: "no_credential" }
  | { state: "no_scope" }
  | { state: "ok"; accounts: GbpAccountWithLocations[] }
  | { state: "error"; message: string };

async function getGbpData(
  userId: string,
  hasCredential: boolean,
  hasGbpScope: boolean
): Promise<GbpStatus> {
  if (!hasCredential) return { state: "no_credential" };
  if (!hasGbpScope) return { state: "no_scope" };
  try {
    const accessToken = await getGbpAccessToken(userId);
    const accounts = await listGbpAccounts(accessToken);
    // Per-account lookups are independent - run them concurrently instead of
    // serially awaiting each one (was N sequential round-trips to Google).
    const enriched: GbpAccountWithLocations[] = await Promise.all(
      accounts.map(async (account) => {
        let locations: GbpLocation[] = [];
        try {
          locations = await listGbpLocations(accessToken, account.name);
        } catch (locErr) {
          // Per-account failure shouldn't kill the whole page; show the
          // account with an empty list and continue.
          console.warn(`[properties/gbp] Failed to list locations for ${account.name}:`, locErr);
        }
        return { ...account, locations };
      })
    );
    return { state: "ok", accounts: enriched };
  } catch (err) {
    const message =
      err instanceof GbpApiError
        ? err.userMessage(process.env.APP_URL || "")
        : err instanceof Error
          ? err.message
          : "Failed to load Business Profile data";
    return { state: "error", message };
  }
}

type GtmAccountWithContainers = GtmAccount & { containers: GtmContainer[] };

type GtmStatus =
  | { state: "no_credential" }
  | { state: "no_scope" }
  | { state: "ok"; accounts: GtmAccountWithContainers[] }
  | { state: "error"; message: string };

async function getGtmData(
  userId: string,
  hasCredential: boolean,
  hasGtmScope: boolean
): Promise<GtmStatus> {
  if (!hasCredential) return { state: "no_credential" };
  if (!hasGtmScope) return { state: "no_scope" };
  try {
    const accessToken = await getGtmAccessToken(userId);
    const accounts = await listGtmAccounts(accessToken);
    // Per-account lookups are independent - run them concurrently instead of
    // serially awaiting each one (was N sequential round-trips to Google).
    const enriched: GtmAccountWithContainers[] = await Promise.all(
      accounts.map(async (account) => {
        let containers: GtmContainer[] = [];
        try {
          containers = await listGtmContainers(accessToken, account.path);
        } catch (cErr) {
          console.warn(`[properties/gtm] Failed to list containers for ${account.path}:`, cErr);
        }
        return { ...account, containers };
      })
    );
    return { state: "ok", accounts: enriched };
  } catch (err) {
    const message =
      err instanceof GtmApiError
        ? err.userMessage(process.env.APP_URL || "")
        : err instanceof Error
          ? err.message
          : "Failed to load Tag Manager data";
    return { state: "error", message };
  }
}

type AdsCustomer = {
  id: string;
  descriptiveName: string | null;
  currencyCode: string | null;
  isManager: boolean;
};

type AdsStatus =
  | { state: "no_credential" }
  | { state: "no_scope" }
  | { state: "ok"; customers: AdsCustomer[] }
  | { state: "error"; message: string };

async function getAdsCustomerInfo(accessToken: string, customerId: string): Promise<AdsCustomer> {
  try {
    const rows = await adsSearch(
      accessToken,
      customerId,
      "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.manager FROM customer",
      customerId
    );
    const row = rows[0] as
      | { customer?: { descriptiveName?: string; currencyCode?: string; manager?: boolean } }
      | undefined;
    return {
      id: customerId,
      descriptiveName: row?.customer?.descriptiveName ?? null,
      currencyCode: row?.customer?.currencyCode ?? null,
      isManager: row?.customer?.manager ?? false,
    };
  } catch (err) {
    // Per-account failure (e.g. client account needing a different
    // login-customer-id) shouldn't kill the whole page - fall back to the
    // bare ID and keep going.
    console.warn(`[properties/ads] Failed to load customer info for ${customerId}:`, err);
    return { id: customerId, descriptiveName: null, currencyCode: null, isManager: false };
  }
}

async function getAdsData(
  userId: string,
  hasCredential: boolean,
  hasAdsScope: boolean
): Promise<AdsStatus> {
  if (!hasCredential) return { state: "no_credential" };
  if (!hasAdsScope) return { state: "no_scope" };
  try {
    const accessToken = await getAdsAccessToken(userId);
    const resourceNames = await listAccessibleCustomers(accessToken);
    const customerIds = resourceNames.map((r) => r.replace("customers/", ""));
    const customers = await Promise.all(
      customerIds.map((id) => getAdsCustomerInfo(accessToken, id))
    );
    return { state: "ok", customers };
  } catch (err) {
    const message =
      err instanceof AdsApiError
        ? err.userMessage(process.env.APP_URL || "")
        : err instanceof Error
          ? err.message
          : "Failed to load Google Ads data";
    return { state: "error", message };
  }
}

/* ────────────────────────────────────────────────────────────
 * Empty-state pane for services we don't ingest yet (Ads).
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

function GbpReconnectPane({ headline, copy }: { headline: string; copy: string }) {
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
        {headline}
      </div>
      <p
        style={{
          color: "var(--ink-2)",
          fontSize: 13,
          maxWidth: 460,
          margin: "0 auto 24px",
        }}
      >
        {copy}
      </p>
      <a className="btn btn-primary" href="/api/gsc/connect">
        Reconnect Google &rarr;
      </a>
    </div>
  );
}

function formatLocationAddress(loc: GbpLocation): string {
  const addr = loc.storefrontAddress;
  return [
    ...(addr?.addressLines ?? []),
    addr?.locality,
    addr?.administrativeArea,
    addr?.regionCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function GbpAccountsPane({ accounts }: { accounts: GbpAccountWithLocations[] }) {
  const totalLocations = accounts.reduce((s, a) => s + a.locations.length, 0);

  if (accounts.length === 0) {
    return (
      <GbpReconnectPane
        headline="No Business Profile accounts"
        copy="Your Google account is authorized for Business Profile but has no accounts attached. Add a location at business.google.com, then come back here."
      />
    );
  }

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--rule-strong)" }}>
      <div
        style={{
          padding: "14px 22px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          {accounts.length} account{accounts.length === 1 ? "" : "s"} · {totalLocations} location
          {totalLocations === 1 ? "" : "s"}
        </div>
        <span className="pill info" style={{ fontSize: 10 }}>LIVE</span>
      </div>

      {accounts.map((account) => (
        <div key={account.name} style={{ padding: "18px 22px", borderBottom: "1px solid var(--rule)" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{account.accountName}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
              {account.type} · {account.name}
            </div>
          </div>

          {account.locations.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
              No locations under this account.
            </p>
          ) : (
            <div>
              {account.locations.map((loc) => (
                <div
                  key={loc.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 0",
                    borderTop: "1px solid var(--rule)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
                      {loc.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                      {formatLocationAddress(loc) || loc.name}
                    </div>
                  </div>
                  {loc.categories?.primaryCategory?.displayName && (
                    <span className="pill" style={{ fontSize: 9 }}>
                      {loc.categories.primaryCategory.displayName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GtmAccountsPane({ accounts }: { accounts: GtmAccountWithContainers[] }) {
  const totalContainers = accounts.reduce((s, a) => s + a.containers.length, 0);

  if (accounts.length === 0) {
    return (
      <GbpReconnectPane
        headline="No Tag Manager accounts"
        copy="Your Google account is authorized for Tag Manager but has no accounts attached. Ask the container owner to add your Google account under GTM Admin > User Management, then come back here."
      />
    );
  }

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--rule-strong)" }}>
      <div
        style={{
          padding: "14px 22px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          {accounts.length} account{accounts.length === 1 ? "" : "s"} · {totalContainers} container
          {totalContainers === 1 ? "" : "s"}
        </div>
        <span className="pill info" style={{ fontSize: 10 }}>LIVE</span>
      </div>

      {accounts.map((account) => (
        <div key={account.path} style={{ padding: "18px 22px", borderBottom: "1px solid var(--rule)" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{account.name}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{account.path}</div>
          </div>

          {account.containers.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
              No containers under this account.
            </p>
          ) : (
            <div>
              {account.containers.map((container) => (
                <div
                  key={container.path}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 0",
                    borderTop: "1px solid var(--rule)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
                      {container.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, fontFamily: "var(--mono)" }}>
                      {container.publicId}
                      {container.usageContext?.length ? ` · ${container.usageContext.join(", ").toLowerCase()}` : ""}
                    </div>
                  </div>
                  <span className="pill" style={{ fontSize: 9 }}>{container.publicId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdsAccountsPane({ customers }: { customers: AdsCustomer[] }) {
  if (customers.length === 0) {
    return (
      <GbpReconnectPane
        headline="No Ads accounts"
        copy="Your Google account is authorized for Ads but has no accessible customer accounts. Ask the account owner to grant access, then come back here."
      />
    );
  }

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--rule-strong)" }}>
      <div
        style={{
          padding: "14px 22px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          {customers.length} account{customers.length === 1 ? "" : "s"}
        </div>
        <span className="pill info" style={{ fontSize: 10 }}>LIVE</span>
      </div>

      {customers.map((customer) => (
        <div
          key={customer.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 12,
            alignItems: "center",
            padding: "18px 22px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
              {customer.descriptiveName || customer.id}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, fontFamily: "var(--mono)" }}>
              {customer.id}
              {customer.currencyCode ? ` · ${customer.currencyCode}` : ""}
            </div>
          </div>
          {customer.isManager && (
            <span className="pill" style={{ fontSize: 9 }}>MANAGER</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────── */
export default async function PropertiesPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const [gscProperties, ga4Properties, credentialScopes, platformAccess] = await Promise.all([
    getGscProperties(session.id),
    getGa4Properties(session.id),
    getCredentialScopes(session.id),
    getPlatformAccessMap(session.id).catch(() => ({ google_ads: false, gtm: false })),
  ]);

  const [gbpStatus, gtmStatus, adsStatus] = await Promise.all([
    getGbpData(session.id, credentialScopes.hasCredential, credentialScopes.hasGbpScope),
    platformAccess.gtm
      ? getGtmData(session.id, credentialScopes.hasCredential, credentialScopes.hasGtmScope)
      : Promise.resolve(null),
    platformAccess.google_ads
      ? getAdsData(session.id, credentialScopes.hasCredential, credentialScopes.hasAdsScope)
      : Promise.resolve(null),
  ]);

  const gbpLocationCount =
    gbpStatus.state === "ok"
      ? gbpStatus.accounts.reduce((s, a) => s + a.locations.length, 0)
      : 0;

  const gtmContainerCount =
    gtmStatus?.state === "ok"
      ? gtmStatus.accounts.reduce((s, a) => s + a.containers.length, 0)
      : 0;

  const adsCustomerCount = adsStatus?.state === "ok" ? adsStatus.customers.length : 0;

  const tabs: { key: PropertyTabKey; label: string; count: number }[] = [
    { key: "ga4", label: "GA4", count: ga4Properties.length },
    { key: "gsc", label: "Search Console", count: gscProperties.length },
    { key: "gbp", label: "Business Profile", count: gbpLocationCount },
    // GTM and Ads are entitlement-gated: the tab simply doesn't exist for others
    ...(platformAccess.gtm
      ? [{ key: "gtm" as const, label: "Tag Manager", count: gtmContainerCount }]
      : []),
    ...(platformAccess.google_ads
      ? [{ key: "ads" as const, label: "Ads", count: adsCustomerCount }]
      : []),
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

  let gbpPane: React.ReactNode;
  if (gbpStatus.state === "ok") {
    gbpPane = <GbpAccountsPane accounts={gbpStatus.accounts} />;
  } else if (gbpStatus.state === "no_scope") {
    gbpPane = (
      <GbpReconnectPane
        headline="Business Profile is live"
        copy="Reviews, calls, direction requests, search keywords and post performance for any locations you manage. Reconnect Google once to add Business Profile access to your stored token. New scope: business.manage."
      />
    );
  } else if (gbpStatus.state === "no_credential") {
    gbpPane = (
      <EmptyServicePane
        service="Business Profile"
        copy="Connect a Google account first so we can read your Business Profile locations, reviews and performance."
      />
    );
  } else {
    gbpPane = (
      <GbpReconnectPane
        headline="Business Profile load failed"
        copy={gbpStatus.message}
      />
    );
  }

  let gtmPane: React.ReactNode = null;
  if (platformAccess.gtm && gtmStatus) {
    if (gtmStatus.state === "ok") {
      gtmPane = <GtmAccountsPane accounts={gtmStatus.accounts} />;
    } else if (gtmStatus.state === "no_scope") {
      gtmPane = (
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
            Tag Manager is ready
          </div>
          <p style={{ color: "var(--ink-2)", fontSize: 13, maxWidth: 460, margin: "0 auto 24px" }}>
            Audit tags, triggers and variables in any container you manage. Connect once to add
            Tag Manager access to your Google grant.
          </p>
          <a className="btn btn-primary" href="/api/platform/connect?platform=gtm">
            Connect Tag Manager &rarr;
          </a>
        </div>
      );
    } else if (gtmStatus.state === "no_credential") {
      gtmPane = (
        <EmptyServicePane
          service="Tag Manager"
          copy="Connect a Google account first so we can read your Tag Manager accounts and containers."
        />
      );
    } else {
      gtmPane = (
        <GbpReconnectPane
          headline="Tag Manager load failed"
          copy={gtmStatus.message}
        />
      );
    }
  }

  let adsPane: React.ReactNode = null;
  if (platformAccess.google_ads && adsStatus) {
    if (adsStatus.state === "ok") {
      adsPane = <AdsAccountsPane customers={adsStatus.customers} />;
    } else if (adsStatus.state === "no_scope") {
      adsPane = (
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
            Ads is ready
          </div>
          <p style={{ color: "var(--ink-2)", fontSize: 13, maxWidth: 460, margin: "0 auto 24px" }}>
            Campaigns, conversion actions and GAQL reporting for any Ads account you manage.
            Connect once to add Ads access to your Google grant.
          </p>
          <a className="btn btn-primary" href="/api/platform/connect?platform=google_ads">
            Connect Google Ads &rarr;
          </a>
        </div>
      );
    } else if (adsStatus.state === "no_credential") {
      adsPane = (
        <EmptyServicePane
          service="Google Ads"
          copy="Connect a Google account first so we can read your Ads accounts and campaigns."
        />
      );
    } else {
      adsPane = (
        <GbpReconnectPane
          headline="Google Ads load failed"
          copy={adsStatus.message}
        />
      );
    }
  }

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
            Reconnect &#x21bb;
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
          ...(platformAccess.gtm ? { gtm: gtmPane } : {}),
          ...(platformAccess.google_ads ? { ads: adsPane } : {}),
        }}
      />
    </>
  );
}
