import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Guides - OMG Bridge",
  description: "Step-by-step guides for connecting OMG Bridge to Claude, Cursor, ChatGPT, and more.",
};

interface CardProps {
  title: string;
  badge: { label: string; tone: "accent" | "muted" };
  initial: string;
  initialColor: string;
  initialBg: string;
  children: React.ReactNode;
}

function GuideCard({ title, badge, initial, initialColor, initialBg, children }: CardProps) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "rgba(14,20,32,0.5)", border: "1px solid var(--glass-border)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-sm)",
            background: initialBg,
            color: initialColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {initial}
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            background: badge.tone === "accent" ? "rgba(0,179,179,0.12)" : "rgba(255,255,255,0.05)",
            border: badge.tone === "accent" ? "1px solid rgba(0,179,179,0.25)" : "1px solid var(--glass-border)",
            color: badge.tone === "accent" ? "var(--accent-light)" : "var(--text-secondary)",
          }}
        >
          {badge.label}
        </span>
      </div>
      {children}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span style={{ color: "var(--text-muted)", fontFamily: "monospace", flexShrink: 0 }}>
        {n}.
      </span>
      <span style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>{children}</span>
    </li>
  );
}

const inlineCode: React.CSSProperties = {
  background: "rgba(6,10,16,0.6)",
  border: "1px solid var(--glass-border)",
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: 12,
  color: "var(--accent-light)",
  fontFamily: "monospace",
};

export default function GuidesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--accent-light)",
            marginBottom: 12,
          }}
        >
          Setup
        </div>
        <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Setup Guides
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Get connected in minutes. Choose your AI tool below.
        </p>
      </div>

      <div className="space-y-6">
        <GuideCard
          title="Claude.ai"
          badge={{ label: "OAuth - Recommended", tone: "accent" }}
          initial="C"
          initialColor="#FB923C"
          initialBg="rgba(251,146,60,0.12)"
        >
          <ol className="space-y-3 text-sm">
            <Step n={1}>
              Sign in at <strong style={{ color: "var(--text-primary)" }}>bridge.theomg.ai</strong> and connect your Google account via the dashboard.
            </Step>
            <Step n={2}>
              In Claude.ai, go to <strong style={{ color: "var(--text-primary)" }}>Settings - Integrations - Add custom integration</strong>.
            </Step>
            <Step n={3}>Enter your MCP endpoint URL from the dashboard.</Step>
            <Step n={4}>
              Claude will redirect you to OMG Bridge to authorize access. Select which properties to share.
            </Step>
            <Step n={5}>
              After authorizing, Claude will have access to all 30 GSC, GA4, and GBP tools.
            </Step>
          </ol>
        </GuideCard>

        <GuideCard
          title="Claude Desktop"
          badge={{ label: "API Key", tone: "muted" }}
          initial="D"
          initialColor="#A855F7"
          initialBg="rgba(168,85,247,0.12)"
        >
          <ol className="space-y-3 text-sm">
            <Step n={1}>
              From your OMG Bridge dashboard, go to <strong style={{ color: "var(--text-primary)" }}>API Keys</strong> and create a new key. Copy it - it is shown only once.
            </Step>
            <Step n={2}>
              Open your Claude Desktop config file at{" "}
              <code style={inlineCode}>~/Library/Application Support/Claude/claude_desktop_config.json</code>.
            </Step>
            <Step n={3}>
              <span>Add this block under <code style={inlineCode}>mcpServers</code>:</span>
              <pre
                className="mt-2 rounded-lg p-3 text-xs overflow-x-auto"
                style={{
                  background: "rgba(6,10,16,0.7)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--accent-light)",
                  fontFamily: "monospace",
                }}
              >
{`"omg-connector": {
  "url": "https://bridge.theomg.ai/api/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}`}
              </pre>
            </Step>
            <Step n={4}>
              Restart Claude Desktop. The OMG Bridge tools will appear in Claude&apos;s tool list.
            </Step>
          </ol>
        </GuideCard>

        <GuideCard
          title="Cursor"
          badge={{ label: "API Key", tone: "muted" }}
          initial="Cu"
          initialColor="#22D3EE"
          initialBg="rgba(34,211,238,0.12)"
        >
          <ol className="space-y-3 text-sm">
            <Step n={1}>
              Create an API key from your OMG Bridge dashboard under <strong style={{ color: "var(--text-primary)" }}>API Keys</strong>.
            </Step>
            <Step n={2}>
              In Cursor, go to <strong style={{ color: "var(--text-primary)" }}>Settings - MCP</strong> and click <strong style={{ color: "var(--text-primary)" }}>Add MCP Server</strong>.
            </Step>
            <Step n={3}>
              Set the URL to your MCP endpoint and add{" "}
              <code style={inlineCode}>Authorization: Bearer YOUR_API_KEY</code> as a header.
            </Step>
            <Step n={4}>
              Save and reload. Cursor&apos;s agent will now have access to all GSC, GA4, and GBP tools.
            </Step>
          </ol>
        </GuideCard>

        <GuideCard
          title="ChatGPT"
          badge={{ label: "OAuth", tone: "accent" }}
          initial="G"
          initialColor="#10B981"
          initialBg="rgba(16,185,129,0.12)"
        >
          <ol className="space-y-3 text-sm">
            <Step n={1}>
              Sign in at <strong style={{ color: "var(--text-primary)" }}>chatgpt.com</strong> and open <strong style={{ color: "var(--text-primary)" }}>Settings - Connectors</strong>.
            </Step>
            <Step n={2}>Click <strong style={{ color: "var(--text-primary)" }}>Add connector</strong> and paste your MCP endpoint URL.</Step>
            <Step n={3}>
              Follow the OAuth authorization flow to grant access to your GSC, GA4, and GBP properties.
            </Step>
          </ol>
        </GuideCard>

        <GuideCard
          title="Managing Properties"
          badge={{ label: "Dashboard", tone: "muted" }}
          initial="P"
          initialColor="var(--text-secondary)"
          initialBg="rgba(255,255,255,0.05)"
        >
          <div className="space-y-3 text-sm">
            <p style={{ color: "var(--text-secondary)" }}>
              Your AI assistant only has access to properties you explicitly activate. From the dashboard:
            </p>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span style={{ color: "var(--text-muted)" }}>-</span>
                <span style={{ color: "var(--text-secondary)" }}>Toggle GSC properties on/off using the checkboxes in the GSC section.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--text-muted)" }}>-</span>
                <span style={{ color: "var(--text-secondary)" }}>Toggle GA4 properties on/off in the GA4 section.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--text-muted)" }}>-</span>
                <span style={{ color: "var(--text-secondary)" }}>If you want to grant access to a new property, connect Google again to refresh the property list.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--text-muted)" }}>-</span>
                <span style={{ color: "var(--text-secondary)" }}>When using Claude.ai or ChatGPT OAuth, the consent page also lets you choose which properties to share per-session.</span>
              </li>
            </ul>
          </div>
        </GuideCard>
      </div>
    </div>
  );
}
