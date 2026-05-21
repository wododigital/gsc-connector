"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";

interface ApiKeyDisplay {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface ApiKeysClientProps {
  initialKeys: ApiKeyDisplay[];
}

const FRESH_KEY_TTL_MS = 10 * 60 * 1000;

/**
 * Singular API key UI. Each OMG account is allowed exactly one active key
 * at a time; rotating it goes through /api/keys/regenerate which revokes
 * the old one and mints a new one in a single transaction.
 *
 * The plaintext key is never persisted — we surface it once via the API
 * response and hold it in component state for up to 10 minutes so the
 * user has time to paste it into their AI client of choice.
 */
export function ApiKeysClient({ initialKeys }: ApiKeysClientProps) {
  const initialActive = initialKeys.find((k) => k.isActive) ?? null;
  const [activeKey, setActiveKey] = useState<ApiKeyDisplay | null>(initialActive);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!freshKey) return;
    const t = window.setTimeout(() => setFreshKey(null), FRESH_KEY_TTL_MS);
    return () => window.clearTimeout(t);
  }, [freshKey]);

  const handleGenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      const endpoint = activeKey ? "/api/keys/regenerate" : "/api/keys";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default" }),
      });
      const data = await res.json();
      if (!res.ok || !data.key) {
        setError(data.error ?? "Failed to generate key");
        return;
      }
      setFreshKey(data.key as string);
      setActiveKey({
        id: data.id,
        name: data.name,
        keyPrefix: data.keyPrefix,
        isActive: true,
        lastUsedAt: null,
        createdAt: data.createdAt,
      });
    } catch (err) {
      console.error("[api-keys-client] generate failed", err);
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    if (!activeKey) return;
    if (
      !confirm(
        "Revoke this API key? Any AI client using it will stop working until you generate a new one."
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/keys/${activeKey.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Failed to revoke key");
        return;
      }
      setActiveKey(null);
      setFreshKey(null);
    } catch (err) {
      console.error("[api-keys-client] revoke failed", err);
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>

      <section className="key-card">
        <header className="card-head">
          <div>
            <div className="eyebrow">YOUR API KEY</div>
            <h2>{activeKey ? "Active" : "No key yet"}</h2>
            <p className="lede">
              One API key per account. Use it in Claude Desktop, Claude Code, Cursor, or Gemini CLI.
              For Claude.ai and ChatGPT, use OAuth on the dashboard instead.
            </p>
          </div>
          <div className="head-actions">
            {activeKey ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={handleGenerate}
                >
                  {busy ? "WORKING…" : "REGENERATE"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busy}
                  onClick={handleRevoke}
                >
                  REVOKE
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={handleGenerate}
              >
                {busy ? "GENERATING…" : "+ GENERATE KEY"}
              </button>
            )}
          </div>
        </header>

        {error && <p className="key-error">{error}</p>}

        {freshKey && (
          <div className="fresh-key">
            <div className="fresh-key-row">
              <code>{freshKey}</code>
              <CopyButton text={freshKey} label="Copy" />
            </div>
            <p>
              ⚠ This is the only time you&rsquo;ll see the full key. It will disappear from this page
              after 10 minutes. Paste it into your AI tool now.
            </p>
          </div>
        )}

        {activeKey && (
          <dl className="key-meta">
            <div>
              <dt>Key preview</dt>
              <dd className="mono">{activeKey.keyPrefix}…••••••••••••</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd className="mono">{new Date(activeKey.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Last used</dt>
              <dd className="mono">
                {activeKey.lastUsedAt
                  ? new Date(activeKey.lastUsedAt).toLocaleString()
                  : "Never"}
              </dd>
            </div>
          </dl>
        )}

        {!activeKey && !freshKey && (
          <p className="empty-hint">
            Generate a key here, then head back to the dashboard. The bearer value will be pre-filled
            into the Connect Your AI snippets while the key is fresh.
          </p>
        )}
      </section>
    </>
  );
}

const CSS = `
.key-card {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 28px 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.key-card .card-head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: start;
}
.key-card .eyebrow {
  font-size: 10px;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 6px;
}
.key-card h2 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 28px;
  letter-spacing: -0.025em;
  text-transform: uppercase;
  color: var(--ink);
}
.key-card .lede {
  margin-top: 8px;
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.6;
  max-width: 560px;
}
.key-card .head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.key-card .key-error {
  margin: 0;
  font-size: 12.5px;
  color: var(--vermilion);
}

.key-card .fresh-key {
  border: 1px solid var(--card-rule);
  background: var(--bg);
  padding: 18px 20px;
}
.key-card .fresh-key-row {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}
.key-card .fresh-key code {
  font-family: var(--mono);
  font-size: 13.5px;
  color: var(--teal-bright);
  word-break: break-all;
  flex: 1;
  min-width: 220px;
}
.key-card .fresh-key p {
  margin: 10px 0 0;
  font-size: 11.5px;
  color: var(--amber);
  letter-spacing: 0.02em;
}

.key-card .key-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px 24px;
  padding-top: 18px;
  margin: 0;
  border-top: 1px solid var(--rule);
}
.key-card .key-meta dt {
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 4px;
}
.key-card .key-meta dd {
  margin: 0;
  font-size: 13px;
  color: var(--ink);
}
.key-card .key-meta dd.mono {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--ink-2);
}
.key-card .empty-hint {
  margin: 0;
  padding: 14px 16px;
  background: var(--bg);
  border: 1px dashed var(--rule-strong);
  font-size: 12.5px;
  color: var(--ink-3);
}

@media (max-width: 720px) {
  .key-card .card-head { grid-template-columns: 1fr; }
  .key-card .head-actions { justify-content: flex-start; }
}
`;
