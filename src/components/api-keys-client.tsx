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
        <div className="p-4 rounded-xl bg-green-950 border border-green-700">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-1">
                API key created successfully
              </h3>
              <p className="text-xs text-green-600">
                Copy this key now - it will not be shown again.
              </p>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-green-600 hover:text-green-400 text-sm shrink-0"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950 border border-green-800">
            <code className="flex-1 text-sm text-green-300 font-mono break-all">
              {newlyCreatedKey}
            </code>
            <CopyButton text={newlyCreatedKey} label="Copy key" />
          </div>
        </div>
      )}

      {/* Create key form */}
      {showCreateForm ? (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-100 mb-3">Create new API key</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label
                htmlFor="key-name"
                className="block text-xs text-zinc-400 mb-1"
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
                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
            </div>
            {createError && (
              <p className="text-sm text-red-400">{createError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating || !newKeyName.trim()}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
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
                className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors"
        >
          + Create new API key
        </button>
      )}

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">
          No API keys yet. Create one to use GSC Connect with Claude Desktop or Cursor.
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-zinc-100">
                    {key.name}
                  </span>
                  {key.isActive ? (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-green-950 text-green-400 border border-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-zinc-800 text-zinc-500 border border-zinc-700">
                      Revoked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="font-mono">{key.keyPrefix}...</span>
                  <span>Created {formatDate(key.createdAt)}</span>
                  {key.lastUsedAt && (
                    <span>Last used {formatDate(key.lastUsedAt)}</span>
                  )}
                  {!key.lastUsedAt && (
                    <span className="text-zinc-600">Never used</span>
                  )}
                </div>
              </div>
              {key.isActive && (
                <button
                  onClick={() => handleRevoke(key.id)}
                  disabled={revokingId === key.id}
                  className="px-3 py-1.5 text-xs bg-red-950 hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed text-red-300 border border-red-800 rounded-md transition-colors shrink-0"
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
