"use client";

/**
 * GA4PropertyManager — Swiss Dark Modernist prop-table for GA4 properties.
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
      <div className="prop-table">
        {properties.length === 0 ? (
          <div className="prop-empty">No GA4 properties available.</div>
        ) : (
          properties.map((property, idx) => {
            const exposed = active.has(property.id);
            return (
              <div key={property.id} className={`prop-row${exposed ? " exposed" : ""}`}>
                <button
                  type="button"
                  className="toggle"
                  onClick={() => toggle(property.id)}
                  aria-label={`${exposed ? "Hide" : "Expose"} ${property.displayName}`}
                />
                <div className="info">
                  <div className="url">{property.displayName}</div>
                  <div className="meta">
                    PROPERTY {property.propertyId}
                    {property.accountName ? ` · ${property.accountName.toUpperCase()}` : ""}
                  </div>
                </div>
                {idx === 0 ? <span className="pill">PRIMARY</span> : <span />}
                <span className="pill state">{exposed ? "EXPOSED" : "HIDDEN"}</span>
                <span className="menu">⋯</span>
              </div>
            );
          })
        )}
      </div>

      <div className="prop-actions">
        <button onClick={save} disabled={isPending} className="btn btn-primary">
          {isPending ? "SAVING..." : "SAVE SELECTION"}
        </button>
        {saved && <span className="pill success">SAVED</span>}
        {error && <span className="pill error">{error}</span>}
        <span className="prop-count">
          {active.size} OF {properties.length} EXPOSED
        </span>
      </div>
    </div>
  );
}
