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
  error: "border-l-red-500",
  warning: "border-l-yellow-500",
  info: "border-l-blue-500",
  success: "border-l-green-500",
};

const TYPE_BADGE: Record<string, string> = {
  new_user: "bg-green-900/40 text-green-300",
  payment_success: "bg-green-900/40 text-green-300",
  payment_failed: "bg-red-900/40 text-red-300",
  subscription_cancelled: "bg-yellow-900/40 text-yellow-300",
  new_ticket: "bg-blue-900/40 text-blue-300",
  webhook_error: "bg-red-900/40 text-red-300",
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
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setUnreadOnly(!unreadOnly); fetchNotifications(!unreadOnly); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              unreadOnly ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Unread only
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-zinc-500 text-sm">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-zinc-500 text-sm">No notifications</p>
        ) : notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead([n.id])}
            className={`bg-zinc-900 border border-zinc-800 border-l-4 ${SEVERITY_BORDER[n.severity] ?? "border-l-zinc-700"} rounded-lg p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors ${!n.isRead ? "opacity-100" : "opacity-60"}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_BADGE[n.type] ?? "bg-zinc-800 text-zinc-400"}`}>
                    {n.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-zinc-500">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm font-semibold text-white">{n.title}</p>
                <p className="text-sm text-zinc-400 mt-0.5">{n.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
