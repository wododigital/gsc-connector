"use client";

/**
 * PropertyManager — Swiss Dark Modernist prop-table for GSC properties.
 * Submits to POST /api/gsc/properties to persist the active selection.
 */

import { useState, useTransition } from "react";

interface Property {
  id: string;
  siteUrl: string;
  permissionLevel: string;
  isActive: boolean;
}

interface PropertyManagerProps {
  properties: Property[];
}

export function PropertyManager({ properties }: PropertyManagerProps) {
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
        const res = await fetch("/api/gsc/properties", {
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
    <>
      <style>{PROP_TABLE_CSS}</style>
      <div className="prop-table">
        {properties.length === 0 ? (
          <div className="prop-empty">No GSC properties available.</div>
        ) : (
          properties.map((property, idx) => {
            const exposed = active.has(property.id);
            return (
              <div key={property.id} className={`prop-row${exposed ? " exposed" : ""}`}>
                <button
                  type="button"
                  className="toggle"
                  onClick={() => toggle(property.id)}
                  aria-label={`${exposed ? "Hide" : "Expose"} ${property.siteUrl}`}
                />
                <div className="info">
                  <div className="url">{property.siteUrl}</div>
                  <div className="meta">
                    {property.permissionLevel.toUpperCase()} · CONNECTED
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
    </>
  );
}

const PROP_TABLE_CSS = `
.prop-table {
  width: 100%;
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
}
.prop-empty {
  padding: 24px; text-align: center;
  color: var(--ink-3);
  font-size: 12px; letter-spacing: 0.10em; text-transform: uppercase;
}
.prop-row {
  display: grid;
  grid-template-columns: 36px 1fr auto auto auto;
  gap: 16px; align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--rule);
  transition: background .15s;
}
.prop-row:last-child { border-bottom: none; }
.prop-row:hover { background: var(--surface-2); }
.prop-row .toggle {
  width: 36px; height: 20px;
  background: var(--surface-3);
  position: relative; cursor: pointer;
  transition: background .2s;
  border: 1px solid var(--rule);
  padding: 0;
}
.prop-row .toggle::after {
  content: '';
  position: absolute; top: 1px; left: 1px;
  width: 16px; height: 16px;
  background: var(--ink-3);
  transition: all .2s;
}
.prop-row.exposed .toggle { background: var(--teal); border-color: var(--teal); }
.prop-row.exposed .toggle::after { left: 17px; background: var(--bg); }
.prop-row .info { min-width: 0; }
.prop-row .url {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--ink);
  word-break: break-all;
}
.prop-row .meta {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.06em;
  margin-top: 2px;
}
.prop-row .pill {
  font-size: 10px;
  padding: 3px 8px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border: 1px solid var(--rule);
  color: var(--ink-3);
  display: inline-flex; align-items: center; gap: 5px;
  white-space: nowrap;
}
.prop-row.exposed .pill.state { color: var(--teal); border-color: var(--teal); }
.prop-row .menu { color: var(--ink-3); cursor: pointer; padding: 0 6px; font-size: 18px; }
.prop-row .menu:hover { color: var(--vermilion); }

.prop-actions {
  display: flex; align-items: center; gap: 12px;
  padding-top: 16px;
}
.prop-actions .prop-count {
  margin-left: auto;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
  font-family: var(--mono);
}
`;
