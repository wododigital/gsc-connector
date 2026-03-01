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

const ACTION_COLORS: Record<string, string> = {
  payment_success: "text-green-400 bg-green-900/30",
  payment_failed: "text-red-400 bg-red-900/30",
  coupon_redeemed: "text-purple-400 bg-purple-900/30",
  plan_changed_by_admin: "text-blue-400 bg-blue-900/30",
  plan_change: "text-blue-400 bg-blue-900/30",
  subscription_cancelled: "text-yellow-400 bg-yellow-900/30",
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
          <h1 className="text-2xl font-bold text-white">Activity Log</h1>
          <p className="text-zinc-400 text-sm">{total} entries</p>
        </div>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); fetchLogs(1, e.target.value); }}
          className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none"
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a === "all" ? "All Actions" : a.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Timestamp", "Action", "User", "Details"].map((h) => (
                <th key={h} className="text-left text-xs text-zinc-500 uppercase px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center text-zinc-500 py-8">Loading...</td></tr>
            ) : logs.map((l) => (
              <tr key={l.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${ACTION_COLORS[l.action] ?? "text-zinc-400 bg-zinc-800"}`}>
                    {l.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-300 text-xs">{l.userEmail}</td>
                <td className="px-4 py-3 text-xs text-zinc-500 font-mono truncate max-w-xs">
                  {l.details ? JSON.stringify(l.details) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 50 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">Page {page} of {Math.ceil(total / 50)}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); fetchLogs(p); }}
                className="px-3 py-1 bg-zinc-800 disabled:opacity-40 text-white rounded text-xs"
              >
                Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / 50)}
                onClick={() => { const p = page + 1; setPage(p); fetchLogs(p); }}
                className="px-3 py-1 bg-zinc-800 disabled:opacity-40 text-white rounded text-xs"
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
