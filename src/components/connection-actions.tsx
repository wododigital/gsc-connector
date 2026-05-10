"use client";

interface ConnectionActionsProps {
  hasGsc: boolean;
  hasAnalyticsScope: boolean;
}

export function ConnectionActions({
  hasGsc,
  hasAnalyticsScope,
}: ConnectionActionsProps) {
  async function handleDisconnect() {
    if (
      !confirm(
        "Are you sure? This will disconnect your Google account and deactivate all Search Console and Analytics access."
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/gsc/disconnect", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to disconnect. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a href="/api/gsc/connect" className="btn">
        Reconnect ↺
      </a>
      {(hasGsc || hasAnalyticsScope) && (
        <button onClick={handleDisconnect} className="btn btn-danger">
          Disconnect
        </button>
      )}
    </div>
  );
}
