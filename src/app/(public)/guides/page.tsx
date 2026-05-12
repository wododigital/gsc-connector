import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Guides - OMG Bridge",
  description:
    "Step-by-step guides for connecting OMG Bridge to Claude, Cursor, ChatGPT, and more.",
};

interface Guide {
  number: string;
  title: string;
  badge: string;
  badgeTone: "teal" | "muted";
  steps: { text: string; code?: string }[];
}

const guides: Guide[] = [
  {
    number: "01",
    title: "Claude.ai",
    badge: "OAUTH · RECOMMENDED",
    badgeTone: "teal",
    steps: [
      {
        text: "Sign in at bridge.theomg.ai and connect your Google account from the dashboard.",
      },
      {
        text: "In Claude.ai, click your profile icon (bottom-left of the sidebar), then Settings.",
      },
      {
        text: "Open the Connectors tab, scroll to the bottom and click Add custom connector. (Available on Pro, Max, Team and Enterprise plans.)",
      },
      {
        text: "Set Name to OMG Bridge and Remote MCP server URL to your endpoint from the dashboard. Click Add.",
      },
      {
        text: "Click Connect, then approve the OAuth scopes. Pick which properties you want to share when prompted.",
      },
    ],
  },
  {
    number: "02",
    title: "Claude Desktop",
    badge: "API KEY",
    badgeTone: "muted",
    steps: [
      {
        text: "From your OMG Bridge dashboard, go to API Keys and create a new key. Copy it. It is shown only once.",
      },
      {
        text: "Open Claude Desktop, then Settings → Developer → Edit Config. This opens claude_desktop_config.json in your editor.",
      },
      {
        text: "Add this block under mcpServers:",
        code: `{
  "mcpServers": {
    "omg-bridge": {
      "url": "https://bridge.theomg.ai/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`,
      },
      {
        text: "Save the file. Fully quit Claude Desktop (Cmd+Q on macOS) and relaunch. The OMG Bridge tools appear in Claude's tool list under the slider icon.",
      },
      {
        text: "Config file locations — macOS: ~/Library/Application Support/Claude/claude_desktop_config.json. Windows: %APPDATA%\\Claude\\claude_desktop_config.json. Linux: ~/.config/Claude/claude_desktop_config.json.",
      },
    ],
  },
  {
    number: "03",
    title: "Claude Code (CLI)",
    badge: "API KEY",
    badgeTone: "muted",
    steps: [
      {
        text: "Create an API key from your OMG Bridge dashboard under API Keys.",
      },
      {
        text: "Run the following command in any terminal (uses HTTP transport):",
        code: `claude mcp add --transport http omg-bridge \\
  https://bridge.theomg.ai/api/mcp \\
  --header "Authorization: Bearer YOUR_API_KEY"`,
      },
      {
        text: "Add --scope user to install for every project, or --scope project to write a shared .mcp.json next to your code.",
      },
      {
        text: "Verify with: claude mcp list. The OMG Bridge tools will be available in your next claude session.",
      },
    ],
  },
  {
    number: "04",
    title: "Cursor",
    badge: "API KEY",
    badgeTone: "muted",
    steps: [
      {
        text: "Create an API key from your OMG Bridge dashboard under API Keys.",
      },
      {
        text: "In Cursor open the Command Palette and run Cursor Settings (or press Cmd+Shift+J on macOS, Ctrl+Shift+J on Windows/Linux).",
      },
      {
        text: "Open the MCP & Integrations tab and click New MCP Server. Cursor will open ~/.cursor/mcp.json in the editor.",
      },
      {
        text: "Add OMG Bridge under mcpServers in that file:",
        code: `{
  "mcpServers": {
    "omg-bridge": {
      "url": "https://bridge.theomg.ai/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`,
      },
      {
        text: "Save the file and flip the toggle next to OMG Bridge in the MCP panel. Tools become available inside Composer and the Agent tab.",
      },
    ],
  },
  {
    number: "05",
    title: "ChatGPT",
    badge: "OAUTH",
    badgeTone: "teal",
    steps: [
      {
        text: "Sign in at chatgpt.com. Custom MCP connectors are available on Plus, Pro, Business and Enterprise.",
      },
      {
        text: "Open Settings from the profile menu and click the Connectors tab.",
      },
      {
        text: "Scroll down to Advanced settings and enable Developer mode if it is not already on. Back on the Connectors tab click Create.",
      },
      {
        text: "Paste your MCP endpoint URL from the OMG Bridge dashboard, set Authentication to OAuth, and click Save.",
      },
      {
        text: "Click Connect, sign in to OMG Bridge if prompted, and approve the requested properties.",
      },
    ],
  },
  {
    number: "06",
    title: "Managing Properties",
    badge: "DASHBOARD",
    badgeTone: "muted",
    steps: [
      {
        text: "Toggle GSC properties active or hidden using the switches on the Properties page in the dashboard.",
      },
      { text: "Toggle GA4 properties active or hidden in the same place." },
      {
        text: "To grant access to a new property, click Reconnect to refresh the list from Google.",
      },
      {
        text: "When using Claude.ai or ChatGPT OAuth, the consent page also lets you choose which properties to share per session.",
      },
    ],
  },
];

export default function GuidesPage() {
  return (
    <div className="page-shell">
      {/* HERO */}
      <section className="page-hero">
        <div className="page-hero-body">
          <div className="section-eyebrow">
            <span>SETUP</span>
            <span className="rule" />
          </div>
          <h1>
            Setup <span className="underline">guides.</span>
            <br />
            <span className="accent">90 seconds each.</span>
          </h1>
          <p className="lede">
            Pick your AI tool below. Each guide is short. Copy a URL or a
            config block and you are done.
          </p>
        </div>
      </section>

      {/* GUIDES */}
      {guides.map((guide) => (
        <section key={guide.number} className="guide-section">
          <div className="guide-body">
            <div className="guide-head">
              <div className="guide-num">{guide.number}</div>
              <h2>{guide.title}</h2>
              <span className={`guide-badge tone-${guide.badgeTone}`}>
                {guide.badge}
              </span>
            </div>
            <ol className="guide-steps">
              {guide.steps.map((step, i) => (
                <li key={i}>
                  <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                  <div className="step-body">
                    <p>{step.text}</p>
                    {step.code && (
                      <pre className="step-code">
                        <code>{step.code}</code>
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}

      <style>{`
        .page-shell { min-height: 100%; }

        .page-hero {
          display: block;
          border-bottom: 1px solid var(--rule);
        }
        .page-hero-body { padding: 64px 56px 72px; max-width: 1100px; }
        .page-hero h1 {
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(40px, 5.4vw, 64px);
          line-height: 1.0;
          letter-spacing: -0.035em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .page-hero h1 .accent { color: var(--vermilion); }
        .page-hero h1 .underline {
          text-decoration: underline;
          text-decoration-color: var(--teal);
          text-decoration-thickness: 4px;
          text-underline-offset: 6px;
        }
        .page-hero .lede {
          font-size: 16px;
          line-height: 1.65;
          color: var(--ink-2);
          max-width: 580px;
        }

        .guide-section {
          display: block;
          border-bottom: 1px solid var(--rule);
        }
        .guide-body { padding: 48px 56px 64px; max-width: 920px; }

        .guide-head {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--rule);
        }
        .guide-num {
          font-family: var(--display);
          font-weight: 700;
          font-size: 32px;
          line-height: 1;
          color: var(--teal);
          letter-spacing: -0.04em;
        }
        .guide-head h2 {
          font-family: var(--display);
          font-weight: 700;
          font-size: 24px;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: var(--ink);
          flex: 1;
        }
        .guide-badge {
          font-size: 10px;
          padding: 5px 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 600;
          border: 1px solid var(--rule);
        }
        .guide-badge.tone-teal {
          color: var(--teal);
          border-color: rgba(0, 181, 181, 0.4);
          background: rgba(0, 181, 181, 0.06);
        }
        .guide-badge.tone-muted {
          color: var(--ink-3);
          border-color: var(--rule);
        }

        .guide-steps {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        }
        .guide-steps li {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 20px;
          padding: 20px 0;
          border-bottom: 1px solid var(--rule);
        }
        .guide-steps li:last-child { border-bottom: none; }
        .guide-steps .step-num {
          font-family: var(--display);
          font-weight: 700;
          font-size: 22px;
          color: var(--vermilion);
          letter-spacing: -0.02em;
          line-height: 1.2;
          font-variant-numeric: tabular-nums;
        }
        .guide-steps .step-body p {
          font-size: 14px;
          line-height: 1.7;
          color: var(--ink-2);
        }
        .guide-steps .step-code {
          margin-top: 14px;
          padding: 16px 18px;
          background: var(--surface-1);
          border: 1px solid var(--rule-strong);
          color: var(--teal-bright);
          font-family: var(--mono);
          font-size: 12.5px;
          line-height: 1.55;
          overflow-x: auto;
          white-space: pre;
        }

        @media (max-width: 980px) {
          .page-hero-body { padding: 40px 20px 48px; }
          .guide-body { padding: 32px 20px 48px; }
          .guide-head { flex-wrap: wrap; }
          .guide-steps li { grid-template-columns: 40px 1fr; gap: 14px; }
        }
      `}</style>
    </div>
  );
}
