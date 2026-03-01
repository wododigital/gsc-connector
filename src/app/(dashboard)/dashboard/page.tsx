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

// Fetch ALL GSC properties (active + inactive) for the dashboard manager
async function getProperties(userId: string) {
  try {
    return await db.gscProperty.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        siteUrl: true,
        permissionLevel: true,
        isActive: true,
      },
    });
  } catch {
    return [];
  }
}

// Fetch ALL GA4 properties (active + inactive) for the dashboard manager
async function getGA4Properties(userId: string) {
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

// Check whether the user has a Google credential and whether it includes analytics scope
async function getCredentialInfo(userId: string) {
  try {
    const credential = await db.googleCredential.findFirst({
      where: { userId },
      select: { scopes: true },
      orderBy: { updatedAt: "desc" },
    });
    if (!credential) return { hasCredential: false, hasAnalyticsScope: false };
    const hasAnalyticsScope = credential.scopes.includes("analytics.readonly");
    return { hasCredential: true, hasAnalyticsScope };
  } catch {
    return { hasCredential: false, hasAnalyticsScope: false };
  }
}

// Fetch API keys summary
async function getApiKeyCount(userId: string) {
  try {
    return await db.apiKey.count({
      where: { userId, isActive: true },
    });
  } catch {
    return 0;
  }
}

// In production use APP_URL/api/mcp (single port via proxy).
// In development, default to localhost:3000/api/mcp so the proxy is tested too.
const MCP_ENDPOINT = `${process.env.APP_URL || "http://localhost:3000"}/api/mcp`;

const CLAUDE_DESKTOP_CONFIG = JSON.stringify(
  {
    mcpServers: {
      "omg-ai": {
        url: MCP_ENDPOINT,
        headers: {
          Authorization: "Bearer YOUR_API_KEY",
        },
      },
    },
  },
  null,
  2
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Manage your OMG AI setup and integrations.
        </p>
      </div>

      {/* GSC Connection Status */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-100">
            Google Search Console
          </h2>
          {hasGscConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-950 border border-green-800 text-green-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              Not connected
            </span>
          )}
        </div>

        {properties.length > 0 ? (
          <div>
            <p className="text-zinc-400 text-sm mb-3">
              Check the properties you want AI assistants to access. Uncheck to hide from MCP tools.
            </p>
            <PropertyManager properties={properties} />
            <div className="mt-4">
              <a
                href="/api/gsc/connect"
                className="text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                + Connect another Google account
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-zinc-400 text-sm mb-4">
              Connect your Google Search Console account to get started.
            </p>
            <a
              href="/api/gsc/connect"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
            >
              Connect Google Search Console
            </a>
          </div>
        )}
      </section>

      {/* GA4 Properties Section */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-100">
            Google Analytics 4
          </h2>
          {hasAnalyticsScope ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Authorized
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950 border border-amber-800 text-amber-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Not authorized
            </span>
          )}
        </div>

        {!hasAnalyticsScope ? (
          <div className="flex gap-3 p-4 rounded-lg bg-amber-950/30 border border-amber-800/50">
            <span className="text-amber-400 text-lg shrink-0 leading-none mt-0.5">!</span>
            <div>
              <p className="text-sm font-medium text-amber-200 mb-1">
                Analytics access not authorized
              </p>
              <p className="text-zinc-400 text-sm mb-3">
                {hasCredential
                  ? "Your account was connected before GA4 support was added."
                  : "Your account is not yet connected."}{" "}
                Reconnect to grant Google Analytics permission.
              </p>
              <a
                href="/api/gsc/connect"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
              >
                Reconnect Google Account
              </a>
            </div>
          </div>
        ) : ga4Properties.length > 0 ? (
          <div>
            <p className="text-zinc-400 text-sm mb-3">
              Check the GA4 properties you want AI assistants to access. Uncheck to hide from MCP tools.
            </p>
            <GA4PropertyManager properties={ga4Properties} />
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <p className="text-sm text-zinc-400">
              No Google Analytics 4 properties found for your Google account. Make sure you have access to GA4 properties in Google Analytics.
            </p>
          </div>
        )}
      </section>

      {/* Connection Status */}
      {hasCredential && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-zinc-100 mb-4">
            Connection Status
          </h2>
          <div className="flex flex-wrap items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Search Console:</span>
              {properties.length > 0 ? (
                <span className="text-sm font-medium text-green-400">Connected</span>
              ) : (
                <span className="text-sm font-medium text-zinc-500">Not connected</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Analytics:</span>
              {hasAnalyticsScope ? (
                <span className="text-sm font-medium text-blue-400">Authorized</span>
              ) : (
                <span className="text-sm font-medium text-amber-400">Not authorized</span>
              )}
            </div>
          </div>
          <ConnectionActions
            hasGsc={properties.length > 0}
            hasAnalyticsScope={hasAnalyticsScope}
          />
        </section>
      )}

      {/* MCP Endpoint section */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-zinc-100 mb-1">
          MCP Endpoint
        </h2>
        <p className="text-zinc-400 text-sm mb-4">
          Use this URL to connect OMG AI to your AI tools.
        </p>

        {/* Endpoint URL */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700 mb-6">
          <code className="flex-1 text-sm text-green-300 font-mono truncate">
            {MCP_ENDPOINT}
          </code>
          <CopyButton text={MCP_ENDPOINT} label="Copy URL" />
        </div>

        {/* Setup instructions - tab-style */}
        <SetupInstructions />
      </section>

      {/* API Keys summary */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 mb-1">
              API Keys
            </h2>
            <p className="text-zinc-400 text-sm">
              Used for Claude Desktop and Cursor integrations.
            </p>
          </div>
          <a
            href="/dashboard/keys"
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
          >
            Manage keys
          </a>
        </div>
        {apiKeyCount > 0 ? (
          <p className="text-zinc-300 text-sm">
            You have{" "}
            <span className="font-semibold text-green-400">{apiKeyCount}</span>{" "}
            active {apiKeyCount === 1 ? "key" : "keys"}.
          </p>
        ) : (
          <p className="text-zinc-400 text-sm">
            No API keys yet.{" "}
            <a
              href="/dashboard/keys"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              Create your first key
            </a>{" "}
            to use Claude Desktop or Cursor.
          </p>
        )}
      </section>

      {/* Usage logs link */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 mb-1">
              Usage Logs
            </h2>
            <p className="text-zinc-400 text-sm">
              View a history of all MCP tool calls made on your account.
            </p>
          </div>
          <a
            href="/dashboard/logs"
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
          >
            View logs
          </a>
        </div>
      </section>
    </div>
  );
}

// Server component for setup instructions layout - client tabs handled separately
function SetupInstructions() {
  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-300 mb-3">
        Setup instructions
      </h3>
      <div className="space-y-4">
        {/* Claude.ai */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-medium text-zinc-100 hover:bg-zinc-750 transition-colors list-none">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Claude.ai</span>
              <span className="px-1.5 py-0.5 rounded text-xs bg-green-950 text-green-400 border border-green-800">
                OAuth - no key needed
              </span>
            </div>
            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">
              +
            </span>
          </summary>
          <div className="px-4 py-3 text-sm text-zinc-400 space-y-2 border border-t-0 border-zinc-700 rounded-b-lg bg-zinc-900">
            <p>Claude.ai connects via OAuth - no API key required.</p>
            <ol className="space-y-1 pl-4 list-decimal text-zinc-300">
              <li>Go to Claude.ai Settings</li>
              <li>Click Integrations in the sidebar</li>
              <li>Click Add integration</li>
              <li>
                Paste the endpoint URL:{" "}
                <code className="text-green-300 text-xs font-mono bg-zinc-800 px-1 py-0.5 rounded">
                  {MCP_ENDPOINT}
                </code>
              </li>
              <li>Authorize when prompted</li>
            </ol>
          </div>
        </details>

        {/* Claude Desktop */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-medium text-zinc-100 hover:bg-zinc-750 transition-colors list-none">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Claude Desktop</span>
              <span className="px-1.5 py-0.5 rounded text-xs bg-zinc-700 text-zinc-300 border border-zinc-600">
                Requires API key
              </span>
            </div>
            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">
              +
            </span>
          </summary>
          <div className="px-4 py-3 text-sm text-zinc-400 space-y-3 border border-t-0 border-zinc-700 rounded-b-lg bg-zinc-900">
            <p>
              Create an API key first from the{" "}
              <a href="/dashboard/keys" className="text-green-400 hover:text-green-300">
                API Keys
              </a>{" "}
              page, then add this to your{" "}
              <code className="text-zinc-300 text-xs font-mono bg-zinc-800 px-1 py-0.5 rounded">
                claude_desktop_config.json
              </code>
              :
            </p>
            <div className="relative">
              <pre className="text-xs text-green-300 font-mono bg-zinc-800 border border-zinc-700 rounded-lg p-4 overflow-x-auto">
                {CLAUDE_DESKTOP_CONFIG}
              </pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={CLAUDE_DESKTOP_CONFIG} label="Copy" />
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Replace YOUR_API_KEY with the key from the API Keys page.
              Config file location: macOS/Linux -
              <code className="ml-1 text-zinc-400 font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code>
            </p>
          </div>
        </details>

        {/* Cursor */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-medium text-zinc-100 hover:bg-zinc-750 transition-colors list-none">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Cursor</span>
              <span className="px-1.5 py-0.5 rounded text-xs bg-zinc-700 text-zinc-300 border border-zinc-600">
                Requires API key
              </span>
            </div>
            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">
              +
            </span>
          </summary>
          <div className="px-4 py-3 text-sm text-zinc-400 space-y-2 border border-t-0 border-zinc-700 rounded-b-lg bg-zinc-900">
            <p>
              Create an API key from the{" "}
              <a href="/dashboard/keys" className="text-green-400 hover:text-green-300">
                API Keys
              </a>{" "}
              page, then:
            </p>
            <ol className="space-y-1 pl-4 list-decimal text-zinc-300">
              <li>Open Cursor Settings (Cmd+,)</li>
              <li>Go to Features tab, then MCP</li>
              <li>Click Add new MCP server</li>
              <li>
                Set type to <code className="text-green-300 text-xs font-mono bg-zinc-800 px-1 py-0.5 rounded">sse</code> or{" "}
                <code className="text-green-300 text-xs font-mono bg-zinc-800 px-1 py-0.5 rounded">http</code>
              </li>
              <li>
                Set URL to{" "}
                <code className="text-green-300 text-xs font-mono bg-zinc-800 px-1 py-0.5 rounded">
                  {MCP_ENDPOINT}
                </code>
              </li>
              <li>
                Add header:{" "}
                <code className="text-green-300 text-xs font-mono bg-zinc-800 px-1 py-0.5 rounded">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </li>
            </ol>
          </div>
        </details>

        {/* ChatGPT */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-500 list-none cursor-not-allowed opacity-60">
            <div className="flex items-center gap-2">
              <span>ChatGPT</span>
              <span className="px-1.5 py-0.5 rounded text-xs bg-zinc-800 text-zinc-500 border border-zinc-700">
                Coming soon
              </span>
            </div>
          </summary>
        </details>
      </div>
    </div>
  );
}
