import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { CopyButton } from "@/components/copy-button";
import { ConnectionActions } from "@/components/connection-actions";
import { BrandStatusCard } from "@/components/brand-status-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview - OMG Bridge",
};

/* ────────────────────────────────────────────────────────────
 * Data loaders — every loader is wrapped so a single DB hiccup
 * doesn't blank out the entire dashboard.
 * ──────────────────────────────────────────────────────────── */
async function getProperties(userId: string) {
  try {
    return await db.gscProperty.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, siteUrl: true, permissionLevel: true, isActive: true },
    });
  } catch { return []; }
}

async function getGA4Properties(userId: string) {
  try {
    return await db.ga4Property.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, propertyId: true, displayName: true, accountName: true, isActive: true },
    });
  } catch { return []; }
}

async function getCredentialInfo(userId: string) {
  try {
    const credential = await db.googleCredential.findFirst({
      where: { userId },
      select: { scopes: true },
      orderBy: { updatedAt: "desc" },
    });
    if (!credential) return { hasCredential: false, hasAnalyticsScope: false };
    return { hasCredential: true, hasAnalyticsScope: credential.scopes.includes("analytics.readonly") };
  } catch { return { hasCredential: false, hasAnalyticsScope: false }; }
}

async function getApiKeyCount(userId: string) {
  try { return await db.apiKey.count({ where: { userId, isActive: true } }); }
  catch { return 0; }
}

async function getBrandProfile(userId: string) {
  try {
    return await db.brandProfile.findUnique({
      where: { userId },
      select: {
        companyName: true, logoUrl: true, logoUrlDark: true,
        primaryColor: true, secondaryColor: true,
        accentColor: true, accentColorDark: true,
        fontFamily: true, reportTheme: true,
        reportDos: true, reportDonts: true,
        isApproved: true,
      },
    });
  } catch { return null; }
}

async function getRecentLogs(userId: string) {
  try {
    return await db.usageLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch { return []; }
}

async function getUsageStats(userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  try {
    const [count, agg] = await Promise.all([
      db.usageLog.count({ where: { userId, createdAt: { gte: sevenDaysAgo } } }),
      db.usageLog.aggregate({
        where: { userId, createdAt: { gte: sevenDaysAgo } },
        _avg: { responseTimeMs: true },
      }),
    ]);
    return { calls7d: count, avgMs: agg._avg.responseTimeMs ? Math.round(agg._avg.responseTimeMs) : null };
  } catch {
    return { calls7d: 0, avgMs: null };
  }
}

const MCP_ENDPOINT = `${process.env.APP_URL || "http://localhost:3000"}/api/mcp`;

const CLAUDE_DESKTOP_CONFIG = JSON.stringify(
  { mcpServers: { "omg-connector": { url: MCP_ENDPOINT, headers: { Authorization: "Bearer YOUR_API_KEY" } } } },
  null, 2
);

/* ────────────────────────────────────────────────────────────
 * Inline AI brand SVGs for the data-table FROM column.
 * ──────────────────────────────────────────────────────────── */
const ClaudeIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.64445 2.55279C8.39746 2.05881 7.79679 1.85859 7.30281 2.10558C6.80883 2.35257 6.60861 2.95324 6.8556 3.44722L9.68128 9.09859L5.06655 5.92596C4.61145 5.61308 3.98887 5.72837 3.67598 6.18348C3.3631 6.63858 3.47839 7.26116 3.9335 7.57405L9.40503 11.3357L3.05258 11.0014C2.50106 10.9724 2.03043 11.3959 2.00141 11.9474C1.97238 12.499 2.39594 12.9696 2.94747 12.9986L8.74187 13.3036L4.44532 16.168C3.9858 16.4743 3.86162 17.0952 4.16797 17.5547C4.47433 18.0142 5.0952 18.1384 5.55473 17.8321L9.19687 15.404L6.68629 18.9188C6.36528 19.3682 6.46937 19.9927 6.91879 20.3137C7.3682 20.6347 7.99275 20.5307 8.31376 20.0812L11.3471 15.8345L10.5136 20.8356C10.4228 21.3804 10.7909 21.8956 11.3356 21.9864C11.8804 22.0772 12.3956 21.7092 12.4864 21.1644L13.2883 16.3532L15.6588 20.0408C15.9575 20.5053 16.5762 20.6398 17.0408 20.3412C17.5054 20.0425 17.6399 19.4238 17.3412 18.9592L15.5553 16.1812L18.3217 18.7348C18.7276 19.1094 19.3602 19.0841 19.7348 18.6783C20.1094 18.2725 20.0841 17.6398 19.6783 17.2652L16.6427 14.4631L20.876 14.9923C21.424 15.0608 21.9238 14.6721 21.9923 14.124C22.0608 13.576 21.6721 13.0762 21.1241 13.0077L16.9342 12.484L21.2291 11.4734C21.7667 11.3469 22.0999 10.8086 21.9734 10.271C21.8469 9.73336 21.3086 9.40009 20.771 9.52659L15.1819 10.8417L19.2863 5.61783C19.6276 5.18356 19.5521 4.5549 19.1178 4.21369C18.6836 3.87247 18.0549 3.94791 17.7137 4.38218L13.8574 9.29015L14.738 3.65438C14.8233 3.10872 14.4501 2.59725 13.9044 2.51199C13.3587 2.42673 12.8473 2.79996 12.762 3.34563L11.876 9.01594L8.64445 2.55279Z" /></svg>
);
const ChatGPTIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" /></svg>
);
const GeminiIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81Z" /></svg>
);
const CursorIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" /></svg>
);

function aiBrandFor(source: string): { tone: string; label: string; icon: React.ReactNode } {
  const s = (source || "").toLowerCase();
  if (s.includes("claude")) return { tone: "claude", label: "Claude", icon: ClaudeIcon };
  if (s.includes("chatgpt") || s.includes("openai")) return { tone: "chatgpt", label: "ChatGPT", icon: ChatGPTIcon };
  if (s.includes("gemini") || s.includes("google-ai")) return { tone: "gemini", label: "Gemini", icon: GeminiIcon };
  if (s.includes("cursor")) return { tone: "cursor", label: "Cursor", icon: CursorIcon };
  return { tone: "cursor", label: source || "Unknown", icon: CursorIcon };
}

function statusPillFor(status: string): { tone: string; label: string } {
  const s = (status || "").toLowerCase();
  if (s === "success" || s === "ok") return { tone: "success", label: "OK" };
  if (s === "error" || s === "failed") return { tone: "error", label: "ERR" };
  if (s === "warn" || s === "slow") return { tone: "warn", label: "SLOW" };
  return { tone: "success", label: status || "OK" };
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(d);
}

function userFirstName(email: string): string {
  if (!email) return "there";
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._-]+/)[0] ?? local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const [
    properties,
    ga4Properties,
    credentialInfo,
    apiKeyCount,
    brandProfile,
    recentLogs,
    usageStats,
    subscription,
  ] = await Promise.all([
    getProperties(session.id),
    getGA4Properties(session.id),
    getCredentialInfo(session.id),
    getApiKeyCount(session.id),
    getBrandProfile(session.id),
    getRecentLogs(session.id),
    getUsageStats(session.id),
    db.userSubscription
      .findUnique({ where: { userId: session.id }, include: { plan: true } })
      .catch(() => null),
  ]);

  const hasGscConnected = properties.some((p) => p.isActive);
  const { hasCredential, hasAnalyticsScope } = credentialInfo;
  const totalActiveProperties =
    properties.filter((p) => p.isActive).length + ga4Properties.filter((p) => p.isActive).length;

  const planName = (subscription?.plan.name ?? "free").toUpperCase();
  const callsUsed = subscription?.callsUsed ?? 0;
  const callsLimit = subscription?.plan.monthlyCalls ?? 200;
  const periodEnd = subscription?.periodEnd
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(subscription.periodEnd)
    : null;

  const greeting = userFirstName(session.email);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome back, <span className="accent">{greeting}.</span></h1>
          <p className="lede">
            Your bridge handled <strong>{usageStats.calls7d.toLocaleString()} queries</strong> this week across{" "}
            {totalActiveProperties} connected propert{totalActiveProperties === 1 ? "y" : "ies"}.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat">
          <div className="label">QUERIES · 7D</div>
          <div className="num">{usageStats.calls7d.toLocaleString()}</div>
          <div className="trend">{callsLimit > 0 ? `${Math.round((callsUsed / callsLimit) * 100)}% of period` : "—"}</div>
        </div>
        <div className="stat">
          <div className="label">PROPERTIES</div>
          <div className="num teal">{totalActiveProperties}</div>
          <div className="trend">
            {properties.filter((p) => p.isActive).length} GSC · {ga4Properties.filter((p) => p.isActive).length} GA4
          </div>
        </div>
        <div className="stat">
          <div className="label">AVG LATENCY</div>
          <div className="num">
            {usageStats.avgMs != null ? `${(usageStats.avgMs / 1000).toFixed(2)}` : "—"}
            {usageStats.avgMs != null && <span className="unit">s</span>}
          </div>
          <div className="trend">last 7 days</div>
        </div>
        <div className="stat">
          <div className="label">PLAN</div>
          <div className="num vermilion">{planName}</div>
          <div className="trend">{periodEnd ? `Renews ${periodEnd}` : "—"}</div>
        </div>
      </div>

      {/* Connected services */}
      <div className="section-header">
        <h2>Connected Services</h2>
        <div className="right">
          {hasCredential && (
            <ConnectionActions hasGsc={properties.length > 0} hasAnalyticsScope={hasAnalyticsScope} />
          )}
        </div>
      </div>

      <div className="service-grid">
        <ServiceCard
          name="GSC"
          connected={hasGscConnected}
          metaLabel="SITES EXPOSED"
          metaValue={`${properties.filter((p) => p.isActive).length} of ${properties.length || "0"}`}
          subLabel={hasCredential ? "STATUS" : "SETUP TIME"}
          subValue={hasCredential ? "Live" : "~ 30 seconds"}
          ctaConnect="/api/gsc/connect"
        />
        <ServiceCard
          name="GA4"
          connected={hasAnalyticsScope && ga4Properties.length > 0}
          metaLabel="PROPERTIES EXPOSED"
          metaValue={`${ga4Properties.filter((p) => p.isActive).length} of ${ga4Properties.length || "0"}`}
          subLabel={hasAnalyticsScope ? "STATUS" : "SETUP TIME"}
          subValue={hasAnalyticsScope ? "Live" : "~ 30 seconds"}
          ctaConnect="/api/gsc/connect"
        />
        <ServiceCard
          name={"BUSINESS PROFILE"}
          connected={false}
          metaLabel="LOCATIONS"
          metaValue="0 connected"
          subLabel="SETUP TIME"
          subValue="~ 30 seconds"
          ctaConnect="#"
        />
        <ServiceCard
          name={"GOOGLE ADS"}
          connected={false}
          metaLabel="SCOPE"
          metaValue="Campaigns · spend · ROAS"
          subLabel="SETUP TIME"
          subValue="~ 30 seconds"
          ctaConnect="#"
        />
      </div>

      {/* GSC + GA4 property exposure preview (top 5; full list lives on /dashboard/properties) */}
      <div className="section-header">
        <h2>Property Exposure</h2>
        <div className="right">
          <a href="/dashboard/properties">MANAGE PROPERTIES →</a>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        <PropertyPreviewCard
          title="GOOGLE SEARCH CONSOLE"
          connected={hasGscConnected}
          connectedLabel="CONNECTED"
          notConnectedLabel="NOT CONNECTED"
          rows={properties.slice(0, 5).map((p) => ({
            id: p.id,
            label: p.siteUrl,
            isActive: p.isActive,
          }))}
          totalCount={properties.length}
          emptyCopy="Connect your Google Search Console to get started."
          emptyCta={{ href: "/api/gsc/connect", label: "+ CONNECT GSC" }}
        />
        <PropertyPreviewCard
          title="GOOGLE ANALYTICS 4"
          connected={hasAnalyticsScope && ga4Properties.length > 0}
          connectedLabel="AUTHORIZED"
          notConnectedLabel={hasAnalyticsScope ? "NO PROPERTIES" : "NOT AUTHORIZED"}
          rows={ga4Properties.slice(0, 5).map((p) => ({
            id: p.id,
            label: p.displayName ?? p.propertyId,
            sub: p.accountName ?? undefined,
            isActive: p.isActive,
          }))}
          totalCount={ga4Properties.length}
          emptyCopy={
            !hasAnalyticsScope
              ? hasCredential
                ? "Connected before GA4 support was added. Reconnect to grant Analytics permission."
                : "Account not yet connected. Authorize Google to enable Analytics."
              : "No GA4 properties found. Make sure your Google account has access to GA4."
          }
          emptyCta={
            !hasAnalyticsScope
              ? { href: "/api/gsc/connect", label: "RECONNECT GOOGLE" }
              : undefined
          }
        />
      </div>

      {/* Recent queries */}
      <div className="section-header">
        <h2>Recent Queries</h2>
        <div className="right"><a href="/dashboard/logs">VIEW ALL LOGS →</a></div>
      </div>
      {recentLogs.length === 0 ? (
        <div style={{ padding: 36, textAlign: "center", background: "var(--surface-1)", border: "1px dashed var(--rule-strong)", color: "var(--ink-3)", fontSize: 13 }}>
          No queries yet. Connect an AI assistant to your MCP endpoint to see live activity here.
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>TIME</th>
              <th>FROM</th>
              <th>TOOL CALLED</th>
              <th>QUERY</th>
              <th className="right">LATENCY</th>
              <th className="right">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {recentLogs.map((log) => {
              const ai = aiBrandFor(log.source);
              const status = statusPillFor(log.status);
              return (
                <tr key={log.id}>
                  <td className="dim mono">{formatTime(log.createdAt)}</td>
                  <td>
                    <span className={`ai-mark ${ai.tone}`}>
                      {ai.icon}
                      {ai.label}
                    </span>
                  </td>
                  <td className="mono">{log.toolName}</td>
                  <td>{log.siteUrl ?? "—"}</td>
                  <td className="right mono">
                    {log.responseTimeMs != null ? `${(log.responseTimeMs / 1000).toFixed(2)}s` : "—"}
                  </td>
                  <td className="right">
                    <span className={`pill ${status.tone}`}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* MCP endpoint */}
      <div className="section-header">
        <h2>Your MCP Endpoint</h2>
        <div className="right"><a href="/dashboard/keys">MANAGE KEYS →</a></div>
      </div>
      <div className="endpoint-card">
        <div className="ehead">
          <span>PRODUCTION ENDPOINT</span>
          <span className="live">LIVE</span>
        </div>
        <div className="ebody">
          <code>{MCP_ENDPOINT}</code>
          <CopyButton text={MCP_ENDPOINT} label="Copy URL" />
        </div>
      </div>

      {/* Brand profile status */}
      <div className="section-header">
        <h2>Brand Profile</h2>
        <div className="right"><a href="/dashboard/branding">EDIT BRAND →</a></div>
      </div>
      <BrandStatusCard profile={brandProfile} />

      {/* Setup instructions */}
      <div className="section-header">
        <h2>Connect Your AI</h2>
        <div className="right">
          <span>{apiKeyCount} ACTIVE {apiKeyCount === 1 ? "KEY" : "KEYS"}</span>
        </div>
      </div>
      <SetupInstructions />
    </>
  );
}

/* ────────────────────────────────────────────────────────────
 * Property preview card — top 5 rows + "Manage all" link.
 * Used on the overview to give a glanceable view; full management
 * lives on /dashboard/properties.
 * ──────────────────────────────────────────────────────────── */
function PropertyPreviewCard({
  title,
  connected,
  connectedLabel,
  notConnectedLabel,
  rows,
  totalCount,
  emptyCopy,
  emptyCta,
}: {
  title: string;
  connected: boolean;
  connectedLabel: string;
  notConnectedLabel: string;
  rows: { id: string; label: string; sub?: string; isActive: boolean }[];
  totalCount: number;
  emptyCopy: string;
  emptyCta?: { href: string; label: string };
}) {
  const hidden = totalCount - rows.length;
  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--rule-strong)", padding: 22, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink)" }}>
          {title}
        </h3>
        <span className={`pill ${connected ? "info" : ""}`}>
          {connected ? connectedLabel : notConnectedLabel}
        </span>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: emptyCta ? 14 : 0 }}>{emptyCopy}</p>
          {emptyCta && (
            <a href={emptyCta.href} className="btn btn-primary">{emptyCta.label}</a>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((row) => (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.label}
                  </div>
                  {row.sub && (
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.sub}
                    </div>
                  )}
                </div>
                <span className={`pill${row.isActive ? " info" : ""}`} style={{ fontSize: 9 }}>
                  {row.isActive ? "EXPOSED" : "HIDDEN"}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            <span style={{ color: "var(--ink-3)" }}>
              Showing {rows.length} of {totalCount}
              {hidden > 0 ? ` · +${hidden} more` : ""}
            </span>
            <a href="/dashboard/properties" style={{ color: "var(--teal)", textDecoration: "none" }}>
              View all →
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Service card
 * ──────────────────────────────────────────────────────────── */
function ServiceCard({
  name, connected, metaLabel, metaValue, subLabel, subValue, ctaConnect,
}: {
  name: string;
  connected: boolean;
  metaLabel: string;
  metaValue: string;
  subLabel: string;
  subValue: string;
  ctaConnect: string;
}) {
  return (
    <div className={`service-card${connected ? " connected" : ""}`}>
      <div className="head">
        <div className="name" dangerouslySetInnerHTML={{ __html: name.replace(/ /g, "<br/>") }} />
        <div className="pill">{connected ? "CONNECTED" : "NOT CONNECTED"}</div>
      </div>
      <div className="meta">
        <div className="label">{metaLabel}</div>
        <div>{metaValue}</div>
        <div className="label" style={{ marginTop: 8 }}>{subLabel}</div>
        <div>{subValue}</div>
      </div>
      <div className="actions">
        {connected ? (
          <>
            <a href="/dashboard" className="primary">CONFIGURE</a>
            <a href={ctaConnect}>RECONNECT</a>
          </>
        ) : (
          <a href={ctaConnect} className="primary">+ CONNECT NOW</a>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Setup instructions (Claude.ai, Claude Desktop, Cursor, ChatGPT)
 * ──────────────────────────────────────────────────────────── */
function SetupInstructions() {
  return (
    <div>
      {/* Claude.ai */}
      <details className="setup-card">
        <summary>
          <span>CLAUDE.AI · OAUTH (NO KEY NEEDED)</span>
          <span className="right">+</span>
        </summary>
        <div className="body">
          <p>Claude.ai connects via OAuth - no API key required.</p>
          <ol>
            <li>Go to Claude.ai Settings</li>
            <li>Click Integrations in the sidebar</li>
            <li>Click Add integration</li>
            <li>Paste the endpoint URL: <code>{MCP_ENDPOINT}</code></li>
            <li>Authorize when prompted</li>
          </ol>
        </div>
      </details>

      {/* Claude Desktop */}
      <details className="setup-card">
        <summary>
          <span>CLAUDE DESKTOP · REQUIRES API KEY</span>
          <span className="right">+</span>
        </summary>
        <div className="body">
          <p>
            Create an API key first from the <a href="/dashboard/keys" style={{ color: "var(--teal)" }}>API Keys</a> page,
            then add this to your <code>claude_desktop_config.json</code>:
          </p>
          <pre>{CLAUDE_DESKTOP_CONFIG}</pre>
          <p style={{ marginTop: 10, fontSize: 11, color: "var(--ink-3)" }}>
            Replace YOUR_API_KEY with the key from the API Keys page. macOS/Linux config file:
            <code style={{ marginLeft: 6 }}>~/Library/Application Support/Claude/claude_desktop_config.json</code>
          </p>
        </div>
      </details>

      {/* Cursor */}
      <details className="setup-card">
        <summary>
          <span>CURSOR · REQUIRES API KEY</span>
          <span className="right">+</span>
        </summary>
        <div className="body">
          <p>
            Create an API key from the <a href="/dashboard/keys" style={{ color: "var(--teal)" }}>API Keys</a> page, then:
          </p>
          <ol>
            <li>Open Cursor Settings (Cmd+,)</li>
            <li>Go to Features tab, then MCP</li>
            <li>Click Add new MCP server</li>
            <li>Set type to <code>sse</code> or <code>http</code></li>
            <li>Set URL to <code>{MCP_ENDPOINT}</code></li>
            <li>Add header: <code>Authorization: Bearer YOUR_API_KEY</code></li>
          </ol>
        </div>
      </details>

      {/* ChatGPT */}
      <details className="setup-card">
        <summary>
          <span>CHATGPT · OAUTH (NO KEY NEEDED)</span>
          <span className="right">+</span>
        </summary>
        <div className="body">
          <p>ChatGPT connects via OAuth - no API key required.</p>
          <ol>
            <li>Go to chatgpt.com and sign in</li>
            <li>Click your profile icon, then Settings</li>
            <li>Go to the Connectors section</li>
            <li>Click Add connector</li>
            <li>Paste the endpoint URL: <code>{MCP_ENDPOINT}</code></li>
            <li>Follow the OAuth authorization flow</li>
          </ol>
        </div>
      </details>
    </div>
  );
}
