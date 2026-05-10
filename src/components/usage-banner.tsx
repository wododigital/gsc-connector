"use client";

import { useEffect, useState } from "react";

interface Props {
  callsUsed: number;
  callsLimit: number;
  isFreeUser: boolean;
  periodEnd: string;
}

const STORAGE_KEY_PREFIX = "omg-banner-dismissed-";

type Level = "info" | "warn" | "blocked" | null;

function computeLevel(callsUsed: number, callsLimit: number, isFreeUser: boolean): Level {
  if (!isFreeUser || callsLimit <= 0) return null;
  const pct = (callsUsed / callsLimit) * 100;
  if (pct >= 100) return "blocked";
  if (pct >= 90) return "warn";
  if (pct >= 25) return "info";
  return null;
}

/**
 * Plan-aware usage banner — Swiss Dark Modernist treatment.
 * Free users see escalating prompts at 25%, 90%, and 100% of monthly quota.
 * Annual users never see this. Renders as a teal left rail inside .usage-banner.
 */
export function UsageBanner({ callsUsed, callsLimit, isFreeUser, periodEnd }: Props) {
  const level = computeLevel(callsUsed, callsLimit, isFreeUser);
  const storageKey = level
    ? `${STORAGE_KEY_PREFIX}${level}-${periodEnd.slice(0, 10)}`
    : "";
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (level === "info" && typeof window !== "undefined") {
      setDismissed(window.localStorage.getItem(storageKey) === "1");
    } else {
      setDismissed(false);
    }
  }, [level, storageKey]);

  if (!level) return null;
  if (level === "info" && dismissed) return null;

  const remaining = Math.max(0, callsLimit - callsUsed);
  const pct = Math.min(100, Math.round((callsUsed / callsLimit) * 100));
  const periodResetDate = new Date(periodEnd).toLocaleDateString();

  // Per-level rail color and CTA tone.
  const rail =
    level === "blocked"
      ? "rgba(255, 107, 74, 0.7)"
      : level === "warn"
      ? "rgba(244, 184, 96, 0.7)"
      : "rgba(0, 181, 181, 0.5)";

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, "1");
  };

  return (
    <>
      <style>{USAGE_BANNER_CSS}</style>
      <div className="usage-banner" style={{ borderLeftColor: rail }}>
        <div className="info">
          {level === "info" && (
            <>
              <strong>
                {callsUsed.toLocaleString()} of {callsLimit.toLocaleString()}
              </strong>{" "}
              queries used this period · {pct}% of your monthly quota.
            </>
          )}
          {level === "warn" && (
            <>
              <strong>{remaining.toLocaleString()} queries</strong> remaining this period. Upgrade to
              Annual for unlimited tool calls.
            </>
          )}
          {level === "blocked" && (
            <>
              You&apos;ve reached your monthly limit of{" "}
              <strong>{callsLimit.toLocaleString()} queries</strong>. Tool calls are paused until your
              period resets on <strong>{periodResetDate}</strong>.
            </>
          )}
        </div>
        <div className="banner-actions">
          <a href="/dashboard/billing">UPGRADE PLAN →</a>
          {level === "info" && (
            <button onClick={dismiss} className="dismiss" aria-label="Dismiss">
              ×
            </button>
          )}
        </div>
      </div>
    </>
  );
}

const USAGE_BANNER_CSS = `
.usage-banner {
  padding: 14px 18px;
  background: var(--surface-1);
  border-left: 3px solid rgba(0, 181, 181, 0.5);
  margin: 24px 0;
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  font-size: 12.5px;
  color: var(--ink-2);
}
.usage-banner .info { color: var(--ink-2); }
.usage-banner .info strong { color: var(--ink); font-weight: 600; }
.usage-banner .banner-actions {
  display: flex; align-items: center; gap: 14px;
}
.usage-banner .banner-actions a {
  color: var(--teal);
  text-decoration: none;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  transition: color .15s;
}
.usage-banner .banner-actions a:hover { color: var(--vermilion); }
.usage-banner .banner-actions .dismiss {
  background: none;
  border: 1px solid var(--rule);
  color: var(--ink-3);
  width: 22px; height: 22px;
  font-size: 14px; line-height: 1;
  cursor: pointer;
  transition: all .15s;
}
.usage-banner .banner-actions .dismiss:hover { color: var(--vermilion); border-color: var(--vermilion); }
`;
