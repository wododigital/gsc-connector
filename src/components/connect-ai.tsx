"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";

interface Props {
  mcpEndpoint: string;
  hasActiveKey: boolean;
  activeKeyPrefix: string | null;
}

type TabId =
  | "claude-web"
  | "claude-desktop"
  | "claude-code"
  | "cursor"
  | "gemini"
  | "chatgpt";

interface Tab {
  id: TabId;
  label: string;
  auth: "oauth" | "api-key";
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: "claude-web",
    label: "Claude.ai",
    auth: "oauth",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8.64445 2.55279C8.39746 2.05881 7.79679 1.85859 7.30281 2.10558C6.80883 2.35257 6.60861 2.95324 6.8556 3.44722L9.68128 9.09859L5.06655 5.92596C4.61145 5.61308 3.98887 5.72837 3.67598 6.18348C3.3631 6.63858 3.47839 7.26116 3.9335 7.57405L9.40503 11.3357L3.05258 11.0014C2.50106 10.9724 2.03043 11.3959 2.00141 11.9474C1.97238 12.499 2.39594 12.9696 2.94747 12.9986L8.74187 13.3036L4.44532 16.168C3.9858 16.4743 3.86162 17.0952 4.16797 17.5547C4.47433 18.0142 5.0952 18.1384 5.55473 17.8321L9.19687 15.404L6.68629 18.9188C6.36528 19.3682 6.46937 19.9927 6.91879 20.3137C7.3682 20.6347 7.99275 20.5307 8.31376 20.0812L11.3471 15.8345L10.5136 20.8356C10.4228 21.3804 10.7909 21.8956 11.3356 21.9864C11.8804 22.0772 12.3956 21.7092 12.4864 21.1644L13.2883 16.3532L15.6588 20.0408C15.9575 20.5053 16.5762 20.6398 17.0408 20.3412C17.5054 20.0425 17.6399 19.4238 17.3412 18.9592L15.5553 16.1812L18.3217 18.7348C18.7276 19.1094 19.3602 19.0841 19.7348 18.6783C20.1094 18.2725 20.0841 17.6398 19.6783 17.2652L16.6427 14.4631L20.876 14.9923C21.424 15.0608 21.9238 14.6721 21.9923 14.124C22.0608 13.576 21.6721 13.0762 21.1241 13.0077L16.9342 12.484L21.2291 11.4734C21.7667 11.3469 22.0999 10.8086 21.9734 10.271C21.8469 9.73336 21.3086 9.40009 20.771 9.52659L15.1819 10.8417L19.2863 5.61783C19.6276 5.18356 19.5521 4.5549 19.1178 4.21369C18.6836 3.87247 18.0549 3.94791 17.7137 4.38218L13.8574 9.29015L14.738 3.65438C14.8233 3.10872 14.4501 2.59725 13.9044 2.51199C13.3587 2.42673 12.8473 2.79996 12.762 3.34563L11.876 9.01594L8.64445 2.55279Z" />
      </svg>
    ),
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    auth: "api-key",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8.64445 2.55279C8.39746 2.05881 7.79679 1.85859 7.30281 2.10558C6.80883 2.35257 6.60861 2.95324 6.8556 3.44722L9.68128 9.09859L5.06655 5.92596C4.61145 5.61308 3.98887 5.72837 3.67598 6.18348C3.3631 6.63858 3.47839 7.26116 3.9335 7.57405L9.40503 11.3357L3.05258 11.0014C2.50106 10.9724 2.03043 11.3959 2.00141 11.9474C1.97238 12.499 2.39594 12.9696 2.94747 12.9986L8.74187 13.3036L4.44532 16.168C3.9858 16.4743 3.86162 17.0952 4.16797 17.5547C4.47433 18.0142 5.0952 18.1384 5.55473 17.8321L9.19687 15.404L6.68629 18.9188C6.36528 19.3682 6.46937 19.9927 6.91879 20.3137C7.3682 20.6347 7.99275 20.5307 8.31376 20.0812L11.3471 15.8345L10.5136 20.8356C10.4228 21.3804 10.7909 21.8956 11.3356 21.9864C11.8804 22.0772 12.3956 21.7092 12.4864 21.1644L13.2883 16.3532L15.6588 20.0408C15.9575 20.5053 16.5762 20.6398 17.0408 20.3412C17.5054 20.0425 17.6399 19.4238 17.3412 18.9592L15.5553 16.1812L18.3217 18.7348C18.7276 19.1094 19.3602 19.0841 19.7348 18.6783C20.1094 18.2725 20.0841 17.6398 19.6783 17.2652L16.6427 14.4631L20.876 14.9923C21.424 15.0608 21.9238 14.6721 21.9923 14.124C22.0608 13.576 21.6721 13.0762 21.1241 13.0077L16.9342 12.484L21.2291 11.4734C21.7667 11.3469 22.0999 10.8086 21.9734 10.271C21.8469 9.73336 21.3086 9.40009 20.771 9.52659L15.1819 10.8417L19.2863 5.61783C19.6276 5.18356 19.5521 4.5549 19.1178 4.21369C18.6836 3.87247 18.0549 3.94791 17.7137 4.38218L13.8574 9.29015L14.738 3.65438C14.8233 3.10872 14.4501 2.59725 13.9044 2.51199C13.3587 2.42673 12.8473 2.79996 12.762 3.34563L11.876 9.01594L8.64445 2.55279Z" />
      </svg>
    ),
  },
  {
    id: "claude-code",
    label: "Claude Code",
    auth: "api-key",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
  {
    id: "cursor",
    label: "Cursor",
    auth: "api-key",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
      </svg>
    ),
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    auth: "api-key",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81Z" />
      </svg>
    ),
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    auth: "oauth",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
      </svg>
    ),
  },
];

const KEY_PLACEHOLDER = "YOUR_API_KEY";

export function ConnectAi({ mcpEndpoint, hasActiveKey, activeKeyPrefix }: Props) {
  const [active, setActive] = useState<TabId>("claude-web");
  const [keyExists, setKeyExists] = useState(hasActiveKey);
  const [keyPrefix, setKeyPrefix] = useState<string | null>(activeKeyPrefix);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bearer = freshKey ?? KEY_PLACEHOLDER;
  const currentTab = useMemo(() => TABS.find((t) => t.id === active)!, [active]);

  const claudeDesktopConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            "omg-bridge": {
              url: mcpEndpoint,
              headers: { Authorization: `Bearer ${bearer}` },
            },
          },
        },
        null,
        2
      ),
    [bearer, mcpEndpoint]
  );

  const cursorConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            "omg-bridge": {
              url: mcpEndpoint,
              headers: { Authorization: `Bearer ${bearer}` },
            },
          },
        },
        null,
        2
      ),
    [bearer, mcpEndpoint]
  );

  // Gemini CLI uses ~/.gemini/settings.json with the same MCP envelope.
  const geminiConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            "omg-bridge": {
              httpUrl: mcpEndpoint,
              headers: { Authorization: `Bearer ${bearer}` },
            },
          },
        },
        null,
        2
      ),
    [bearer, mcpEndpoint]
  );

  const claudeCodeCmd = `claude mcp add --transport http omg-bridge ${mcpEndpoint} \\
  --header "Authorization: Bearer ${bearer}"`;

  const generate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const endpoint = keyExists ? "/api/keys/regenerate" : "/api/keys";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default" }),
      });
      const data = await res.json();
      if (!res.ok || !data.key) {
        setError(data.error ?? "Failed to generate API key");
        return;
      }
      setFreshKey(data.key as string);
      setKeyPrefix(data.keyPrefix as string);
      setKeyExists(true);
    } catch (err) {
      console.error("[connect-ai] generate failed", err);
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [keyExists]);

  // Auto-dismiss the visible fresh key after 10 minutes so it doesn't sit
  // exposed on a shared screen.
  useEffect(() => {
    if (!freshKey) return;
    const t = window.setTimeout(() => setFreshKey(null), 10 * 60 * 1000);
    return () => window.clearTimeout(t);
  }, [freshKey]);

  return (
    <div className="connect-ai">
      <style>{CSS}</style>

      {/* tab bar */}
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            className={`tab${active === t.id ? " active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            <span className="ico">{t.icon}</span>
            <span className="label">{t.label}</span>
            <span className={`auth-tag ${t.auth}`}>{t.auth === "oauth" ? "OAuth" : "API Key"}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="panel">
        {currentTab.auth === "api-key" && (
          <div className="key-strip">
            <div className="key-info">
              <div className="key-label">YOUR API KEY</div>
              {freshKey ? (
                <div className="key-value">
                  <code>{freshKey}</code>
                  <CopyButton text={freshKey} label="Copy" />
                </div>
              ) : keyExists ? (
                <div className="key-value muted">
                  <code>{keyPrefix ?? "gsc_••••"}…••••••••••••</code>
                  <span className="hint">Stored securely. Regenerate to view a new one.</span>
                </div>
              ) : (
                <div className="key-value muted">
                  <code>No key yet</code>
                  <span className="hint">Generate one to plug into the snippet below.</span>
                </div>
              )}
            </div>
            <div className="key-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={generate}
                disabled={busy}
              >
                {busy ? "GENERATING…" : keyExists ? "REGENERATE KEY" : "GENERATE KEY"}
              </button>
            </div>
            {error && <p className="key-error">{error}</p>}
            {freshKey && (
              <p className="key-warning">
                ⚠ This is the only time you&rsquo;ll see the full key. Copy it now. It will disappear
                from this panel after 10 minutes.
              </p>
            )}
          </div>
        )}

        {active === "claude-web" && (
          <Steps
            intro="Claude.ai connects directly via OAuth, so no key needed. Available on Pro, Max, Team, and Enterprise plans."
            steps={[
              <>Open Claude.ai, click your profile (bottom-left), then <em>Settings</em>.</>,
              <>Open the <em>Connectors</em> tab.</>,
              <>Scroll to the bottom and click <em>Add custom connector</em>.</>,
              <>Set name to <code>OMG Bridge</code> and Remote MCP server URL to <code>{mcpEndpoint}</code>.</>,
              <>Click <em>Add</em>, then <em>Connect</em>, and approve the OAuth scopes.</>,
            ]}
            codeBlocks={[{ title: "Endpoint URL", code: mcpEndpoint }]}
          />
        )}

        {active === "claude-desktop" && (
          <Steps
            intro="Add the OMG Bridge server to your Claude Desktop config file, then restart Claude."
            steps={[
              <>Open Claude Desktop, go to <em>Settings → Developer</em>, click <em>Edit Config</em>.</>,
              <>Add the <code>omg-bridge</code> block to <code>claude_desktop_config.json</code>.</>,
              <>Save the file and fully quit / relaunch Claude Desktop.</>,
            ]}
            codeBlocks={[
              { title: "claude_desktop_config.json", code: claudeDesktopConfig, lang: "json" },
            ]}
            footnote={
              <>
                Config locations:{" "}
                <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> on
                macOS · <code>%APPDATA%\Claude\claude_desktop_config.json</code> on Windows ·{" "}
                <code>~/.config/Claude/claude_desktop_config.json</code> on Linux.
              </>
            }
          />
        )}

        {active === "claude-code" && (
          <Steps
            intro="One command adds OMG Bridge to Claude Code (the CLI). Run it from any project directory."
            steps={[
              <>Generate (or regenerate) your API key above.</>,
              <>Paste the command into your terminal.</>,
              <>Run <code>claude mcp list</code> to verify the connection.</>,
            ]}
            codeBlocks={[{ title: "Terminal", code: claudeCodeCmd, lang: "bash" }]}
            footnote={
              <>
                Add <code>--scope user</code> to install across every project, or{" "}
                <code>--scope project</code> to commit a shared <code>.mcp.json</code> for the team.
              </>
            }
          />
        )}

        {active === "cursor" && (
          <Steps
            intro="Add OMG Bridge to Cursor's MCP config file. Cursor reads it on launch."
            steps={[
              <>Open the Command Palette and run <em>Cursor Settings</em> (<code>Cmd+Shift+J</code>).</>,
              <>Open the <em>MCP &amp; Integrations</em> tab and click <em>New MCP Server</em>.</>,
              <>Paste the block below into <code>~/.cursor/mcp.json</code>.</>,
              <>Toggle <em>OMG Bridge</em> on. Tools appear in Composer and the Agent tab.</>,
            ]}
            codeBlocks={[{ title: "~/.cursor/mcp.json", code: cursorConfig, lang: "json" }]}
          />
        )}

        {active === "gemini" && (
          <Steps
            intro="The Gemini CLI reads MCP servers from a JSON settings file. Install once and OMG Bridge tools become available inside Gemini."
            steps={[
              <>Install Gemini CLI: <code>npm install -g @google/gemini-cli</code> (or use <code>npx</code>).</>,
              <>Open the settings file: <code>~/.gemini/settings.json</code> (create it if missing).</>,
              <>Add OMG Bridge to <code>mcpServers</code> as shown.</>,
              <>Run <code>gemini</code> and confirm the tools appear with <code>/mcp</code>.</>,
            ]}
            codeBlocks={[
              { title: "~/.gemini/settings.json", code: geminiConfig, lang: "json" },
            ]}
            footnote={
              <>
                For a project-scoped install, drop the same file at{" "}
                <code>.gemini/settings.json</code> at the repo root. Verify the server is live by
                typing <code>/mcp</code> inside the Gemini CLI prompt.
              </>
            }
          />
        )}

        {active === "chatgpt" && (
          <Steps
            intro="ChatGPT connects via OAuth. Custom MCP connectors are available on Plus, Pro, Business, and Enterprise."
            steps={[
              <>Sign in at chatgpt.com and open <em>Settings</em> from your profile menu.</>,
              <>Open <em>Connectors → Advanced settings</em> and enable <em>Developer mode</em>.</>,
              <>Back on Connectors click <em>Create</em>, paste the URL below as the MCP server URL, and set Authentication to OAuth.</>,
              <>Save, click <em>Connect</em>, and approve the OMG Bridge consent screen.</>,
            ]}
            codeBlocks={[{ title: "Endpoint URL", code: mcpEndpoint }]}
          />
        )}
      </div>
    </div>
  );
}

interface StepsProps {
  intro: string;
  steps: React.ReactNode[];
  codeBlocks: { title: string; code: string; lang?: string }[];
  footnote?: React.ReactNode;
}

function Steps({ intro, steps, codeBlocks, footnote }: StepsProps) {
  return (
    <div className="steps">
      <p className="intro">{intro}</p>
      <ol className="steps-list">
        {steps.map((s, i) => (
          <li key={i}>
            <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
            <div className="step-body">{s}</div>
          </li>
        ))}
      </ol>
      {codeBlocks.map((block, i) => (
        <div className="snippet" key={i}>
          <div className="snippet-head">
            <span className="snippet-title">{block.title}</span>
            <span className="snippet-lang">{block.lang ?? "text"}</span>
            <span className="snippet-copy">
              <CopyButton text={block.code} label="Copy" />
            </span>
          </div>
          <pre>
            <code>{block.code}</code>
          </pre>
        </div>
      ))}
      {footnote && <p className="footnote">{footnote}</p>}
    </div>
  );
}

const CSS = `
.connect-ai {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
}
.connect-ai .tabs {
  display: flex;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--rule);
  background: var(--bg);
}
.connect-ai .tab {
  flex: 1 1 160px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: transparent;
  border: none;
  border-right: 1px solid var(--rule);
  border-bottom: 2px solid transparent;
  color: var(--ink-3);
  font-family: var(--body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: color .15s, background .15s, border-color .15s;
  text-align: left;
}
.connect-ai .tab:last-child { border-right: none; }
.connect-ai .tab:hover { color: var(--ink); background: var(--surface-2); }
.connect-ai .tab.active {
  color: var(--ink);
  background: var(--surface-1);
  border-bottom-color: var(--teal);
}
.connect-ai .tab .ico {
  display: grid; place-items: center;
  width: 22px; height: 22px;
  color: var(--ink-2);
}
.connect-ai .tab:hover .ico,
.connect-ai .tab.active .ico { color: var(--teal); }
.connect-ai .tab .ico svg { width: 18px; height: 18px; }
.connect-ai .tab .label { flex: 1; }
.connect-ai .tab .auth-tag {
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 7px;
  border: 1px solid var(--rule);
  color: var(--ink-3);
}
.connect-ai .tab .auth-tag.oauth {
  color: var(--teal);
  border-color: rgba(0, 181, 181, 0.4);
}
.connect-ai .tab .auth-tag.api-key {
  color: var(--amber);
  border-color: rgba(244, 184, 96, 0.4);
}

.connect-ai .panel {
  padding: 0;
}

.connect-ai .key-strip {
  padding: 18px 22px;
  background: var(--bg);
  border-bottom: 1px solid var(--rule);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
}
.connect-ai .key-strip .key-label {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 6px;
}
.connect-ai .key-strip .key-value {
  display: flex; align-items: center; gap: 12px;
  flex-wrap: wrap;
}
.connect-ai .key-strip .key-value code {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--teal-bright);
  background: var(--surface-1);
  border: 1px solid var(--rule);
  padding: 6px 10px;
  word-break: break-all;
}
.connect-ai .key-strip .key-value.muted code { color: var(--ink-3); }
.connect-ai .key-strip .key-value .hint {
  font-size: 11.5px;
  color: var(--ink-3);
}
.connect-ai .key-strip .key-error {
  grid-column: 1 / -1;
  font-size: 12px;
  color: var(--vermilion);
  margin: 0;
}
.connect-ai .key-strip .key-warning {
  grid-column: 1 / -1;
  font-size: 11.5px;
  color: var(--amber);
  margin: 4px 0 0;
  letter-spacing: 0.02em;
}

.connect-ai .steps {
  padding: 24px 26px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.connect-ai .steps .intro {
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.65;
  margin: 0;
}
.connect-ai .steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.connect-ai .steps-list li {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 16px;
  align-items: start;
}
.connect-ai .step-num {
  font-family: var(--display);
  font-weight: 700;
  font-size: 18px;
  color: var(--teal);
  letter-spacing: -0.02em;
  line-height: 1.2;
  border-right: 2px solid var(--card-rule);
  padding-right: 12px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.connect-ai .step-body {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--ink-2);
}
.connect-ai .step-body em {
  color: var(--ink);
  font-style: normal;
  font-weight: 600;
}
.connect-ai .step-body code {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--teal-bright);
  background: var(--bg);
  padding: 2px 6px;
  word-break: break-all;
}

.connect-ai .snippet {
  background: var(--bg);
  border: 1px solid var(--rule);
}
.connect-ai .snippet-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--rule);
  background: var(--surface-1);
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.connect-ai .snippet-title { color: var(--ink-2); font-weight: 600; }
.connect-ai .snippet-lang {
  font-family: var(--mono);
  letter-spacing: 0.06em;
  color: var(--ink-3);
}
.connect-ai .snippet-copy { margin-left: auto; }
.connect-ai .snippet pre {
  margin: 0;
  padding: 16px 18px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.55;
  color: var(--teal-bright);
  overflow-x: auto;
  white-space: pre;
}

.connect-ai .footnote {
  font-size: 11.5px;
  color: var(--ink-3);
  margin: 4px 0 0;
  line-height: 1.6;
}
.connect-ai .footnote code {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-2);
  background: var(--bg);
  padding: 1px 5px;
}

@media (max-width: 720px) {
  .connect-ai .tab { flex: 1 1 50%; border-right: none; border-bottom: 1px solid var(--rule); }
  .connect-ai .key-strip { grid-template-columns: 1fr; }
}
`;
