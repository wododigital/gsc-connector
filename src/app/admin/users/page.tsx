"use client";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  plan: string;
  planId: string;
  callsUsed: number;
  callsLimit: number;
  gscPropertiesCount: number;
  ga4PropertiesCount: number;
  subscriptionStatus: string;
}

const PLANS = [
  { id: "plan_free", label: "Free" },
  { id: "plan_pro", label: "Pro" },
  { id: "plan_premium", label: "Premium" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  const fetchUsers = (p = page, s = search) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "50" });
    if (s) params.set("search", s);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setTotal(d.total ?? 0); setLoading(false); });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  };

  const changePlan = async (userId: string, planId: string) => {
    setChangingPlan(userId);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    fetchUsers();
    setChangingPlan(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{total.toLocaleString()} total users</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="glass-input text-sm"
            style={{ width: "240px" }}
          />
          <button type="submit" className="btn-ghost btn-ghost-sm">Search</button>
        </form>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Plan</th>
              <th>Usage</th>
              <th>Props</th>
              <th>Joined</th>
              <th>Change Plan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                  Loading...
                </td>
              </tr>
            ) : users.map((u) => {
              const pct = u.callsLimit > 0 ? Math.round((u.callsUsed / u.callsLimit) * 100) : 0;
              const planBadge =
                u.planId === "plan_premium" ? "badge badge-accent" :
                u.planId === "plan_pro" ? "badge badge-info" :
                "badge badge-muted";
              return (
                <tr key={u.id}>
                  <td>
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{u.email}</div>
                    {u.name && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{u.name}</div>
                    )}
                  </td>
                  <td>
                    <span className={planBadge}>{u.plan}</span>
                  </td>
                  <td style={{ width: "160px" }}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-secondary)" }}>{u.callsUsed}/{u.callsLimit}</span>
                      <span style={{ color: pct >= 90 ? "var(--error)" : pct >= 70 ? "var(--warning)" : "var(--success)" }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          background: pct >= 90 ? "var(--error)" : pct >= 70 ? "var(--warning)" : "var(--success)",
                        }}
                      />
                    </div>
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    GSC: {u.gscPropertiesCount} / GA4: {u.ga4PropertiesCount}
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <select
                      value={u.planId}
                      disabled={changingPlan === u.id}
                      onChange={(e) => changePlan(u.id, e.target.value)}
                      className="glass-select text-xs"
                      style={{ padding: "4px 8px", width: "auto" }}
                    >
                      {PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
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
                onClick={() => { const p = page - 1; setPage(p); fetchUsers(p); }}
                className="btn-ghost btn-ghost-sm"
              >
                Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / 50)}
                onClick={() => { const p = page + 1; setPage(p); fetchUsers(p); }}
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
