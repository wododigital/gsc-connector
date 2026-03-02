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

const SEVERITY_BORDER: Record<string, string> = {
  error: "var(--error)",
  warning: "var(--warning)",
  info: "var(--info)",
  success: "var(--success)",
};

const TYPE_BADGE: Record<string, string> = {
  new_user: "badge-success",
  payment_success: "badge-success",
  payment_failed: "badge-error",
  subscription_cancelled: "badge-warning",
  new_ticket: "badge-info",
  webhook_error: "badge-error",
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

  useEffect(() => { fetchNotifications(); }, []);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Notifications</h1>
          {unreadCount > 0 && (
            <span className="badge badge-error">{unreadCount}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setUnreadOnly(!unreadOnly); fetchNotifications(!unreadOnly); }}
            className={unreadOnly ? "btn-primary btn-primary-sm" : "btn-ghost btn-ghost-sm"}
          >
            Unread only
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-ghost btn-ghost-sm">
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No notifications</p>
        ) : notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead([n.id])}
            className="glass-card p-4 cursor-pointer border-l-4"
            style={{
              borderLeftColor: SEVERITY_BORDER[n.severity] ?? "var(--glass-border)",
              opacity: n.isRead ? 0.6 : 1,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {!n.isRead && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: "var(--info)" }}
                    />
                  )}
                  <span className={`badge ${TYPE_BADGE[n.type] ?? "badge-muted"}`}>
                    {n.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {n.title}
                </p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {n.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
