"use client";
import { useEffect, useState } from "react";

interface ActivityEntry {
  id: string;
  userId: string | null;
  userEmail: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_BADGE: Record<string, string> = {
  payment_success: "badge-success",
  payment_failed: "badge-error",
  coupon_redeemed: "badge-accent",
  plan_changed_by_admin: "badge-info",
  plan_change: "badge-info",
  subscription_cancelled: "badge-warning",
};

const ACTIONS = [
  "all",
  "payment_success",
  "payment_failed",
  "coupon_redeemed",
  "plan_changed_by_admin",
  "subscription_cancelled",
];

export default function AdminActivity() {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchLogs = (p = page, a = action) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (a !== "all") params.set("action", a);
    fetch(`/api/admin/activity?${params}`)
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs ?? []); setTotal(d.total ?? 0); setLoading(false); });
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">{total} entries</p>
        </div>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); fetchLogs(1, e.target.value); }}
          className="glass-select text-sm"
          style={{ width: "auto" }}
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a === "all" ? "All Actions" : a.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="glass-table">
          <thead>
            <tr>
              {["Timestamp", "Action", "User", "Details"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                  Loading...
                </td>
              </tr>
            ) : logs.map((l) => (
              <tr key={l.id}>
                <td className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {new Date(l.createdAt).toLocaleString()}
                </td>
                <td>
                  <span className={`badge ${ACTION_BADGE[l.action] ?? "badge-muted"}`}>
                    {l.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="text-xs" style={{ color: "var(--text-secondary)" }}>{l.userEmail}</td>
                <td className="text-xs font-mono truncate max-w-xs" style={{ color: "var(--text-muted)" }}>
                  {l.details ? JSON.stringify(l.details) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 50 && (
          <div
            className="flex justify-between items-center px-4 py-3"
            style={{ borderTop: "1px solid var(--glass-border)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Page {page} of {Math.ceil(total / 50)}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); fetchLogs(p); }}
                className="btn-ghost btn-ghost-sm"
              >
                Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / 50)}
                onClick={() => { const p = page + 1; setPage(p); fetchLogs(p); }}
                className="btn-ghost btn-ghost-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
