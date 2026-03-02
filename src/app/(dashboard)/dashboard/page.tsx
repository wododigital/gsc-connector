import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { CopyButton } from "@/components/copy-button";
import { PropertyManager } from "@/components/property-manager";
import { GA4PropertyManager } from "@/components/ga4-property-manager";
import { ConnectionActions } from "@/components/connection-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - OMG AI",
};

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

const MCP_ENDPOINT = `${process.env.APP_URL || "http://localhost:3000"}/api/mcp`;

const CLAUDE_DESKTOP_CONFIG = JSON.stringify(
  { mcpServers: { "omg-ai": { url: MCP_ENDPOINT, headers: { Authorization: "Bearer YOUR_API_KEY" } } } },
  null, 2
);

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const [properties, ga4Properties, credentialInfo, apiKeyCount] = await Promise.all([
    getProperties(session.id),
    getGA4Properties(session.id),
    getCredentialInfo(session.id),
    getApiKeyCount(session.id),
  ]);

  const hasGscConnected = properties.some((p) => p.isActive);
  const { hasCredential, hasAnalyticsScope } = credentialInfo;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Manage your OMG AI setup and integrations.</p>
        </div>
        {hasCredential && (
          <ConnectionActions hasGsc={properties.length > 0} hasAnalyticsScope={hasAnalyticsScope} />
        )}
      </div>

      {/* GSC + GA4 side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GSC */}
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Google Search Console
            </h2>
            {hasGscConnected ? (
              <span className="badge badge-success">
                <span className="status-dot status-dot-success"></span>
                Connected
              </span>
            ) : (
              <span className="badge badge-muted">
                <span className="status-dot status-dot-muted"></span>
                Not connected
              </span>
            )}
          </div>

          {properties.length > 0 ? (
            <>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                Toggle properties to control AI access.
              </p>
              <PropertyManager properties={properties} />
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--glass-border)" }}>
                <a href="/api/gsc/connect" className="text-xs transition-colors" style={{ color: "var(--accent-light)" }}>
                  + Connect another account
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                Connect your Google Search Console to get started.
              </p>
              <a href="/api/gsc/connect" className="btn-primary btn-primary-sm">
                Connect GSC
              </a>
            </div>
          )}
        </section>

        {/* GA4 */}
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Google Analytics 4
            </h2>
            {hasAnalyticsScope ? (
              <span className="badge badge-info">
                <span className="status-dot" style={{ background: "var(--info)", width: "6px", height: "6px", borderRadius: "9999px" }}></span>
                Authorized
              </span>
            ) : (
              <span className="badge badge-warning">
                <span className="status-dot status-dot-warning"></span>
                Not authorized
              </span>
            )}
          </div>

          {!hasAnalyticsScope ? (
            <div
              className="flex gap-3 p-3 rounded-lg"
              style={{ background: "var(--warning-bg)", border: "1px solid rgba(251,191,36,0.2)" }}
            >
              <span style={{ color: "var(--warning)", flexShrink: 0, marginTop: "2px" }}>!</span>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--warning)" }}>
                  Analytics not authorized
                </p>
                <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                  {hasCredential
                    ? "Connected before GA4 support was added."
                    : "Account not yet connected."}{" "}
                  Reconnect to grant Analytics permission.
                </p>
                <a href="/api/gsc/connect" className="btn-ghost btn-ghost-sm" style={{ background: "rgba(251,191,36,0.12)", borderColor: "rgba(251,191,36,0.3)", color: "var(--warning)" }}>
                  Reconnect Google
                </a>
              </div>
            </div>
          ) : ga4Properties.length > 0 ? (
            <>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                Toggle properties to control AI access.
              </p>
              <GA4PropertyManager properties={ga4Properties} />
            </>
          ) : (
            <div
              className="p-4 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No GA4 properties found. Make sure your Google account has access to GA4.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* MCP Endpoint */}
      <section className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              MCP Endpoint
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Use this URL to connect OMG AI to Claude, Cursor, or ChatGPT.
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-3 p-3 rounded-lg mb-5"
          style={{ background: "rgba(6,10,16,0.6)", border: "1px solid var(--glass-border)" }}
        >
          <code className="flex-1 text-sm font-mono truncate" style={{ color: "var(--accent-light)" }}>
            {MCP_ENDPOINT}
          </code>
          <CopyButton text={MCP_ENDPOINT} label="Copy URL" />
        </div>

        <SetupInstructions />
      </section>

      {/* Quick links: API Keys | Usage Logs | Billing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            href: "/dashboard/keys",
            title: "API Keys",
            desc: "For Claude Desktop and Cursor.",
            meta: apiKeyCount > 0 ? `${apiKeyCount} active` : "No keys yet",
            metaColor: "var(--accent-light)",
          },
          {
            href: "/dashboard/logs",
            title: "Usage Logs",
            desc: "History of all MCP tool calls.",
            meta: null,
            metaColor: "",
          },
          {
            href: "/dashboard/billing",
            title: "Billing",
            desc: "Manage your plan and usage.",
            meta: null,
            metaColor: "",
          },
        ].map((card) => (
          <a key={card.href} href={card.href} className="glass-card p-4 block" style={{ textDecoration: "none" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {card.title}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Manage →
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{card.desc}</p>
            {card.meta && (
              <p className="text-sm font-semibold mt-2" style={{ color: card.metaColor }}>
                {card.meta}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

function SetupInstructions() {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
        Setup instructions
      </h3>
      <div className="space-y-4">
        {/* Claude.ai */}
        <details className="group">
          <summary
            className="flex items-center justify-between cursor-pointer px-4 py-3 rounded-lg text-sm font-medium list-none"
            style={{
              background: "rgba(6,10,16,0.5)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-secondary)",
            }}
          >
            <div className="flex items-center gap-2">
              <span>Claude.ai</span>
              <span className="badge badge-accent" style={{ fontSize: "11px", padding: "2px 8px" }}>
                OAuth - no key needed
              </span>
            </div>
            <span className="text-xs group-open:rotate-180 transition-transform" style={{ color: "var(--text-muted)" }}>
              +
            </span>
          </summary>
          <div
            className="px-4 py-3 text-sm space-y-2 rounded-b-lg"
            style={{
              background: "rgba(6,10,16,0.4)",
              border: "1px solid var(--glass-border)",
              borderTop: "none",
              color: "var(--text-secondary)",
            }}
          >
            <p>Claude.ai connects via OAuth - no API key required.</p>
            <ol className="space-y-1 pl-4 list-decimal" style={{ color: "var(--text-primary)" }}>
              <li>Go to Claude.ai Settings</li>
              <li>Click Integrations in the sidebar</li>
              <li>Click Add integration</li>
              <li>
                Paste the endpoint URL:{" "}
                <code className="text-xs font-mono px-1 py-0.5 rounded" style={{ color: "var(--accent-light)", background: "rgba(6,10,16,0.6)" }}>
                  {MCP_ENDPOINT}
                </code>
              </li>
              <li>Authorize when prompted</li>
            </ol>
          </div>
        </details>

        {/* Claude Desktop */}
        <details className="group">
          <summary
            className="flex items-center justify-between cursor-pointer px-4 py-3 rounded-lg text-sm font-medium list-none"
            style={{
              background: "rgba(6,10,16,0.5)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-secondary)",
            }}
          >
            <div className="flex items-center gap-2">
              <span>Claude Desktop</span>
              <span className="badge badge-muted" style={{ fontSize: "11px", padding: "2px 8px" }}>
                Requires API key
              </span>
            </div>
            <span className="text-xs group-open:rotate-180 transition-transform" style={{ color: "var(--text-muted)" }}>
              +
            </span>
          </summary>
          <div
            className="px-4 py-3 text-sm space-y-3 rounded-b-lg"
            style={{
              background: "rgba(6,10,16,0.4)",
              border: "1px solid var(--glass-border)",
              borderTop: "none",
              color: "var(--text-secondary)",
            }}
          >
            <p>
              Create an API key first from the{" "}
              <a href="/dashboard/keys" style={{ color: "var(--accent-light)" }}>
                API Keys
              </a>{" "}
              page, then add this to your{" "}
              <code className="text-xs font-mono px-1 py-0.5 rounded" style={{ color: "var(--text-primary)", background: "rgba(6,10,16,0.6)" }}>
                claude_desktop_config.json
              </code>
              :
            </p>
            <div className="relative">
              <pre className="text-xs font-mono p-4 overflow-x-auto rounded-lg" style={{ background: "rgba(6,10,16,0.7)", border: "1px solid var(--glass-border)", color: "var(--accent-light)" }}>
                {CLAUDE_DESKTOP_CONFIG}
              </pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={CLAUDE_DESKTOP_CONFIG} label="Copy" />
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Replace YOUR_API_KEY with the key from the API Keys page. Config file location: macOS/Linux -
              <code className="ml-1 font-mono" style={{ color: "var(--text-secondary)" }}>~/Library/Application Support/Claude/claude_desktop_config.json</code>
            </p>
          </div>
        </details>

        {/* Cursor */}
        <details className="group">
          <summary
            className="flex items-center justify-between cursor-pointer px-4 py-3 rounded-lg text-sm font-medium list-none"
            style={{
              background: "rgba(6,10,16,0.5)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-secondary)",
            }}
          >
            <div className="flex items-center gap-2">
              <span>Cursor</span>
              <span className="badge badge-muted" style={{ fontSize: "11px", padding: "2px 8px" }}>
                Requires API key
              </span>
            </div>
            <span className="text-xs group-open:rotate-180 transition-transform" style={{ color: "var(--text-muted)" }}>
              +
            </span>
          </summary>
          <div
            className="px-4 py-3 text-sm space-y-2 rounded-b-lg"
            style={{
              background: "rgba(6,10,16,0.4)",
              border: "1px solid var(--glass-border)",
              borderTop: "none",
              color: "var(--text-secondary)",
            }}
          >
            <p>
              Create an API key from the{" "}
              <a href="/dashboard/keys" style={{ color: "var(--accent-light)" }}>
                API Keys
              </a>{" "}
              page, then:
            </p>
            <ol className="space-y-1 pl-4 list-decimal" style={{ color: "var(--text-primary)" }}>
              <li>Open Cursor Settings (Cmd+,)</li>
              <li>Go to Features tab, then MCP</li>
              <li>Click Add new MCP server</li>
              <li>
                Set type to <code className="text-xs font-mono px-1 py-0.5 rounded" style={{ color: "var(--accent-light)", background: "rgba(6,10,16,0.6)" }}>sse</code> or{" "}
                <code className="text-xs font-mono px-1 py-0.5 rounded" style={{ color: "var(--accent-light)", background: "rgba(6,10,16,0.6)" }}>http</code>
              </li>
              <li>
                Set URL to{" "}
                <code className="text-xs font-mono px-1 py-0.5 rounded" style={{ color: "var(--accent-light)", background: "rgba(6,10,16,0.6)" }}>
                  {MCP_ENDPOINT}
                </code>
              </li>
              <li>
                Add header:{" "}
                <code className="text-xs font-mono px-1 py-0.5 rounded" style={{ color: "var(--accent-light)", background: "rgba(6,10,16,0.6)" }}>
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </li>
            </ol>
          </div>
        </details>

        {/* ChatGPT - coming soon */}
        <details>
          <summary
            className="flex items-center justify-between px-4 py-3 rounded-lg text-sm list-none opacity-50 cursor-not-allowed"
            style={{
              background: "rgba(6,10,16,0.3)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-muted)",
            }}
          >
            <div className="flex items-center gap-2">
              <span>ChatGPT</span>
              <span className="badge badge-muted" style={{ fontSize: "11px", padding: "2px 8px" }}>
                Coming soon
              </span>
            </div>
          </summary>
        </details>
      </div>
    </div>
  );
}
