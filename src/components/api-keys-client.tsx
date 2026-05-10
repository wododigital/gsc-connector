"use client";

import { useState } from "react";
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

export function ApiKeysClient({ initialKeys }: ApiKeysClientProps) {
  const [keys, setKeys] = useState<ApiKeyDisplay[]>(initialKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>("never");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create API key");
      }

      const data = (await response.json()) as {
        key: string;
        id: string;
        name: string;
        keyPrefix: string;
        createdAt: string;
      };

      // Show the full key once.
      setNewlyCreatedKey(data.key);

      setKeys((prev) => [
        {
          id: data.id,
          name: data.name,
          keyPrefix: data.keyPrefix,
          isActive: true,
          lastUsedAt: null,
          createdAt: data.createdAt,
        },
        ...prev,
      ]);

      setNewKeyName("");
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }

    setRevokingId(keyId);

    try {
      const response = await fetch(`/api/keys/${keyId}`, { method: "DELETE" });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to revoke key");
      }

      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke key");
    } finally {
      setRevokingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return dateStr;
    }
  };

  const formatLastUsed = (dateStr: string | null) => {
    if (!dateStr) return "Never used";
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.round(ms / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <style>{KEYS_CSS}</style>
      <div>
        {/* Newly-created key banner */}
        {newlyCreatedKey && (
          <div className="new-key-banner">
            <div className="info">
              <div className="banner-eyebrow">▸ NEW KEY GENERATED · COPY IT NOW</div>
              <div className="key">{newlyCreatedKey}</div>
              <div className="warning">⚠ This is the only time you&apos;ll see this key. Store it securely.</div>
            </div>
            <div className="banner-actions">
              <CopyButton text={newlyCreatedKey} label="Copy" />
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="btn btn-primary"
                type="button"
              >
                DISMISS ✓
              </button>
            </div>
          </div>
        )}

        {/* Generate Key CTA + inline create form */}
        {!showCreateForm ? (
          <div className="generate-bar">
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              + GENERATE KEY
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="key-create active">
            <h3>Generate a new API key</h3>
            <div className="fields">
              <div>
                <label className="input-label">KEY NAME</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. cursor-laptop, claude-desktop"
                  maxLength={64}
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label">EXPIRES</label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="input-field"
                >
                  <option value="never">Never</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreating || !newKeyName.trim()}
                className="btn btn-primary"
              >
                {isCreating ? "GENERATING..." : "GENERATE"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewKeyName("");
                  setCreateError(null);
                }}
                className="btn"
              >
                CANCEL
              </button>
            </div>
            {createError && <p className="key-create-error">{createError}</p>}
          </form>
        )}

        {/* Keys table */}
        {keys.length === 0 ? (
          <div className="key-empty">
            No API keys yet. Generate one to use OMG Bridge with Claude Desktop or Cursor.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>KEY PREVIEW</th>
                <th>CREATED</th>
                <th>LAST USED</th>
                <th>STATUS</th>
                <th className="right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td><strong style={{ color: "var(--ink)" }}>{key.name}</strong></td>
                  <td className="mono">{key.keyPrefix}...</td>
                  <td className="dim">{formatDate(key.createdAt)}</td>
                  <td className="dim">{formatLastUsed(key.lastUsedAt)}</td>
                  <td>
                    {key.isActive ? (
                      <span className="pill success">ACTIVE</span>
                    ) : (
                      <span className="pill error">REVOKED</span>
                    )}
                  </td>
                  <td className="right">
                    {key.isActive && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(key.id)}
                        disabled={revokingId === key.id}
                        className="btn btn-danger"
                      >
                        {revokingId === key.id ? "REVOKING..." : "REVOKE"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

const KEYS_CSS = `
.generate-bar {
  display: flex; justify-content: flex-end;
  margin-bottom: 24px;
}
.new-key-banner {
  padding: 16px 20px;
  background: var(--surface-2);
  border: 1px solid var(--card-rule);
  margin-bottom: 24px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  flex-wrap: wrap;
}
.new-key-banner .info { font-size: 12px; color: var(--ink-2); flex: 1; min-width: 220px; }
.new-key-banner .banner-eyebrow {
  font-size: 11px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--teal);
}
.new-key-banner .key {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--teal-bright);
  margin-top: 6px;
  word-break: break-all;
}
.new-key-banner .warning {
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--amber);
  margin-top: 6px;
}
.new-key-banner .banner-actions { display: flex; gap: 10px; align-items: center; }

.key-create {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 24px;
  margin-bottom: 24px;
}
.key-create h3 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  margin-bottom: 14px;
  color: var(--ink);
}
.key-create .fields {
  display: grid;
  grid-template-columns: 1fr 200px auto auto;
  gap: 12px;
  align-items: end;
}
.key-create-error {
  margin-top: 10px;
  color: var(--vermilion);
  font-size: 12px;
}

.key-empty {
  text-align: center;
  padding: 56px 24px;
  background: var(--surface-1);
  border: 1px dashed var(--rule-strong);
  color: var(--ink-3);
  font-size: 13px;
}

@media (max-width: 980px) {
  .key-create .fields { grid-template-columns: 1fr; }
}
`;
