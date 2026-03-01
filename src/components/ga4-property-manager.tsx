"use client";

/**
 * GA4PropertyManager
 * Renders all GA4 properties with checkboxes and a Save button.
 * Submits to POST /api/ga4/properties to persist the active selection.
 */

import { useState, useTransition } from "react";

interface GA4Property {
  id: string;
  propertyId: string;
  displayName: string;
  accountName: string | null;
  isActive: boolean;
}

interface GA4PropertyManagerProps {
  properties: GA4Property[];
}

export function GA4PropertyManager({ properties }: GA4PropertyManagerProps) {
  const [active, setActive] = useState<Set<string>>(
    () => new Set(properties.filter((p) => p.isActive).map((p) => p.id))
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSaved(false);
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      try {
        const res = await fetch("/api/ga4/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyIds: Array.from(active) }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? "Failed to save");
        } else {
          setSaved(true);
        }
      } catch {
        setError("Network error - please try again");
      }
    });
  }

  return (
    <div>
      <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
        {properties.map((property) => (
          <label
            key={property.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
              active.has(property.id)
                ? "border-blue-700 bg-blue-950/30"
                : "border-zinc-700 bg-zinc-800/50 opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={active.has(property.id)}
              onChange={() => toggle(property.id)}
              className="accent-blue-500 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-100 font-medium truncate">
                {property.displayName}
              </p>
              <p className="text-xs text-zinc-500 font-mono">
                {property.propertyId}
                {property.accountName && (
                  <span className="ml-1">- {property.accountName}</span>
                )}
              </p>
            </div>
            <span
              className={`text-xs shrink-0 font-medium ${
                active.has(property.id) ? "text-blue-400" : "text-zinc-500"
              }`}
            >
              {active.has(property.id) ? "Active" : "Inactive"}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={isPending}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {isPending ? "Saving..." : "Save selection"}
        </button>
        {saved && <span className="text-sm text-blue-400">Saved</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
        <span className="ml-auto text-xs text-zinc-500">
          {active.size} of {properties.length} active
        </span>
      </div>
    </div>
  );
}
