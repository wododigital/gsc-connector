"use client";
import { useEffect, useState } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const TYPE_PILL: Record<string, string> = {
  new_user: "success",
  payment_success: "success",
  payment_failed: "error",
  subscription_cancelled: "warn",
  new_ticket: "info",
  webhook_error: "error",
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = (unread = unreadOnly) => {
    setLoading(true);
    fetch(`/api/admin/notifications?unreadOnly=${unread}`)
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications ?? []);
        setUnreadCount(d.unreadCount ?? 0);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (ids: string[]) => {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    fetchNotifications();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <span className="num">06</span>
            <span>·</span>
            <span>ADMIN · NOTIFICATIONS</span>
          </div>
          <h1>
            Inbox{" "}
            {unreadCount > 0 && (
              <span className="accent">({unreadCount.toLocaleString()} unread).</span>
            )}
            {unreadCount === 0 && <span className="accent">all clear.</span>}
          </h1>
          <p className="lede">
            Platform events that need a human eye. Click any card to mark it read.
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(!unreadOnly);
              fetchNotifications(!unreadOnly);
            }}
            className={unreadOnly ? "btn btn-primary" : "btn"}
          >
            {unreadOnly ? "Showing Unread" : "Show Unread Only"}
          </button>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="btn btn-danger">
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div
            className="surface-card"
            style={{ textAlign: "center", padding: "32px", color: "var(--ink-3)" }}
          >
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="surface-card"
            style={{ textAlign: "center", padding: "32px", color: "var(--ink-3)" }}
          >
            {unreadOnly ? "No unread notifications." : "No notifications yet."}
          </div>
        ) : (
          notifications.map((n) => {
            const sevClass =
              n.severity === "error"
                ? "severity-error"
                : n.severity === "warning"
                ? "severity-warning"
                : n.severity === "success"
                ? "severity-success"
                : "severity-info";
            const stateClass = n.isRead ? "read" : "unread";
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead([n.id])}
                className={`notif-card ${sevClass} ${stateClass}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !n.isRead) markRead([n.id]);
                }}
              >
                <div className="col">
                  <div className="meta-row">
                    {!n.isRead && (
                      <span
                        className="status-dot"
                        style={{ width: 6, height: 6 }}
                        aria-label="unread"
                      />
                    )}
                    <span className={`pill ${TYPE_PILL[n.type] ?? "info"}`}>
                      {n.type.replace(/_/g, " ")}
                    </span>
                    <span className="ts">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="title">{n.title}</div>
                  <div className="body">{n.message}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
