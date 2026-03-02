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
            className={`glass-list-item ${active.has(property.id) ? "active" : "inactive"}`}
          >
            <input
              type="checkbox"
              checked={active.has(property.id)}
              onChange={() => toggle(property.id)}
              className="shrink-0"
              style={{ accentColor: "var(--accent)" }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {property.displayName}
              </p>
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {property.propertyId}
                {property.accountName && (
                  <span className="ml-1">- {property.accountName}</span>
                )}
              </p>
            </div>
            <span className={`badge ${active.has(property.id) ? "badge-info" : "badge-muted"}`}>
              {active.has(property.id) ? "Active" : "Inactive"}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={isPending}
          className="btn-primary btn-primary-sm"
        >
          {isPending ? "Saving..." : "Save selection"}
        </button>
        {saved && <span className="badge badge-success">Saved</span>}
        {error && <span className="badge badge-error">{error}</span>}
        <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
          {active.size} of {properties.length} active
        </span>
      </div>
    </div>
  );
}
