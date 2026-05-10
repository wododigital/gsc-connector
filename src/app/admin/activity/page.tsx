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

const ACTION_PILL: Record<string, string> = {
  payment_success: "success",
  payment_failed: "error",
  coupon_redeemed: "info",
  plan_changed_by_admin: "info",
  plan_change: "info",
  subscription_cancelled: "warn",
};

const ACTIONS = [
  "all",
  "payment_success",
  "payment_failed",
  "coupon_redeemed",
  "plan_changed_by_admin",
  "subscription_cancelled",
];

const PAGE_SIZE = 50;

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
      .then((d) => {
        setLogs(d.logs ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(total, page * PAGE_SIZE);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            Activity <span className="accent">log.</span>
          </h1>
          <p className="lede">
            Append-only audit trail of every billing event, coupon redemption, and admin override.
          </p>
        </div>
      </div>

      <div className="filter-bar">
        {ACTIONS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setAction(a);
              setPage(1);
              fetchLogs(1, a);
            }}
            className={`chip ${action === a ? "active" : ""}`}
          >
            {a === "all" ? "All Actions" : a.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="logs-meta">
        <span>
          SHOWING <strong>{start}-{end}</strong> OF <strong>{total.toLocaleString()}</strong>
        </span>
        <span>·</span>
        <span>
          FILTER <strong>{action === "all" ? "ALL" : action.replace(/_/g, " ").toUpperCase()}</strong>
        </span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>TIMESTAMP</th>
            <th>ACTION</th>
            <th>USER</th>
            <th>DETAILS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="row-empty">
              <td colSpan={4}>Loading activity...</td>
            </tr>
          ) : logs.length === 0 ? (
            <tr className="row-empty">
              <td colSpan={4}>No activity in this view</td>
            </tr>
          ) : (
            logs.map((l) => (
              <tr key={l.id}>
                <td className="dim mono">{new Date(l.createdAt).toLocaleString()}</td>
                <td>
                  <span className={`pill ${ACTION_PILL[l.action] ?? "info"}`}>
                    {l.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="mono">{l.userEmail || "system"}</td>
                <td
                  className="dim mono"
                  style={{
                    maxWidth: 360,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={l.details ? JSON.stringify(l.details) : "-"}
                >
                  {l.details ? JSON.stringify(l.details) : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="pages">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              const p = page - 1;
              setPage(p);
              fetchLogs(p);
            }}
          >
            ‹ Prev
          </button>
          <span style={{ borderColor: "var(--vermilion)", color: "var(--vermilion)" }}>{page}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => {
              const p = page + 1;
              setPage(p);
              fetchLogs(p);
            }}
          >
            Next ›
          </button>
        </div>
      </div>
    </>
  );
}
