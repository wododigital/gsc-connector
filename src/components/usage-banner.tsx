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
 * Plan-aware usage banner.
 * Free users see escalating prompts at 25%, 90%, and 100% of monthly quota.
 * Annual users never see this.
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
  const styles = {
    info: { bg: "rgba(0,179,179,0.10)", border: "rgba(0,179,179,0.45)", color: "var(--accent-light)", icon: "i" },
    warn: { bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.45)", color: "var(--warning)", icon: "!" },
    blocked: { bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.45)", color: "var(--error)", icon: "✕" },
  }[level];

  const periodResetDate = new Date(periodEnd).toLocaleDateString();

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, "1");
  };

  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3 mb-4"
      style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
    >
      <div
        className="flex items-center justify-center rounded-full text-xs font-bold shrink-0"
        style={{ width: 22, height: 22, background: styles.color, color: "#06080d" }}
      >
        {styles.icon}
      </div>
      <div className="flex-1 text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {level === "info" && (
          <>You&apos;ve used <strong>{callsUsed} of {callsLimit}</strong> free tool calls this month. Upgrade to Annual for unlimited calls - $199/year.</>
        )}
        {level === "warn" && (
          <>You have <strong>{remaining} tool calls</strong> remaining this month. Upgrade to Annual for unlimited calls - $199/year.</>
        )}
        {level === "blocked" && (
          <>You&apos;ve reached your monthly limit of <strong>{callsLimit} tool calls</strong>. Tool calls are paused until your period resets on <strong>{periodResetDate}</strong>. Upgrade now for unlimited access - $199/year.</>
        )}
      </div>
      <a
        href="/dashboard/billing"
        className="btn-primary btn-primary-sm shrink-0"
        style={level === "blocked" ? undefined : { background: styles.color, color: "#06080d" }}
      >
        Upgrade
      </a>
      {level === "info" && (
        <button
          onClick={dismiss}
          className="text-xs shrink-0"
          style={{ color: "var(--text-muted)" }}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
