"use client";

/**
 * PropertiesTabs - Swiss Dark Modernist tab switcher for the Properties page.
 *
 * Pure presentational client island. Receives already-rendered server panes
 * as React children (via named slots) so the heavy data fetching stays on the
 * server. Only the tiny "which pane is visible" state lives on the client.
 *
 * The .tabs / .tab-btn styles are defined globally in (dashboard)/layout.tsx
 * so we don't ship any CSS from here.
 */

import { useState, type ReactNode } from "react";

export type PropertyTabKey = "ga4" | "gsc" | "gbp" | "gtm" | "ads";

interface TabDef {
  key: PropertyTabKey;
  label: string;
  count: number;
}

interface PropertiesTabsProps {
  tabs: TabDef[];
  initial?: PropertyTabKey;
  // Partial: gated tabs (gtm) are omitted entirely for non-entitled users
  panes: Partial<Record<PropertyTabKey, ReactNode>>;
}

export function PropertiesTabs({ tabs, initial, panes }: PropertiesTabsProps) {
  const [active, setActive] = useState<PropertyTabKey>(initial ?? tabs[0]?.key ?? "ga4");

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Connected property sources">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-pane-${t.key}`}
              id={`tab-btn-${t.key}`}
              className={`tab-btn${isActive ? " active" : ""}`}
              onClick={() => setActive(t.key)}
            >
              {t.label} <span className="count">{t.count}</span>
            </button>
          );
        })}
      </div>

      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <div
            key={t.key}
            role="tabpanel"
            id={`tab-pane-${t.key}`}
            aria-labelledby={`tab-btn-${t.key}`}
            hidden={!isActive}
          >
            {panes[t.key]}
          </div>
        );
      })}
    </>
  );
}
