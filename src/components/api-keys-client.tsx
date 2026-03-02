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

      // Show the full key once
      setNewlyCreatedKey(data.key);

      // Add to keys list
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
      const response = await fetch(`/api/keys/${keyId}`, {
        method: "DELETE",
      });

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
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Newly created key - shown once */}
      {newlyCreatedKey && (
        <div className="glass-card p-4" style={{ borderColor: "var(--glass-border-accent)" }}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--success)" }}>
                API key created successfully
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Copy this key now - it will not be shown again.
              </p>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="btn-ghost btn-ghost-sm shrink-0"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(6,10,16,0.6)", border: "1px solid var(--glass-border)" }}>
            <code className="flex-1 text-sm font-mono break-all" style={{ color: "var(--accent-light)" }}>
              {newlyCreatedKey}
            </code>
            <CopyButton text={newlyCreatedKey} label="Copy key" />
          </div>
        </div>
      )}

      {/* Create key form */}
      {showCreateForm ? (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Create new API key</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label
                htmlFor="key-name"
                className="block text-xs mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Key name (e.g., "Claude Desktop", "Cursor - Work")
              </label>
              <input
                id="key-name"
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="My API key"
                maxLength={64}
                className="glass-input text-sm"
                autoFocus
              />
            </div>
            {createError && (
              <p className="text-sm" style={{ color: "var(--error)" }}>{createError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating || !newKeyName.trim()}
                className="btn-primary btn-primary-sm"
              >
                {isCreating ? "Creating..." : "Create key"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewKeyName("");
                  setCreateError(null);
                }}
                className="btn-ghost btn-ghost-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary btn-primary-sm"
        >
          + Create new API key
        </button>
      )}

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
          No API keys yet. Create one to use OMG AI with Claude Desktop or Cursor.
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="glass-card flex items-center gap-4 p-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {key.name}
                  </span>
                  {key.isActive ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-muted">Revoked</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="font-mono">{key.keyPrefix}...</span>
                  <span>Created {formatDate(key.createdAt)}</span>
                  {key.lastUsedAt && (
                    <span>Last used {formatDate(key.lastUsedAt)}</span>
                  )}
                  {!key.lastUsedAt && (
                    <span>Never used</span>
                  )}
                </div>
              </div>
              {key.isActive && (
                <button
                  onClick={() => handleRevoke(key.id)}
                  disabled={revokingId === key.id}
                  className="btn-ghost btn-ghost-sm shrink-0"
                >
                  {revokingId === key.id ? "Revoking..." : "Revoke"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
