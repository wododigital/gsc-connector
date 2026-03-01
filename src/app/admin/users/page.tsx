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
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-zinc-400 text-sm">{total.toLocaleString()} total users</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 w-64"
          />
          <button type="submit" className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm">
            Search
          </button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-xs text-zinc-500 uppercase px-4 py-3">Email</th>
              <th className="text-left text-xs text-zinc-500 uppercase px-4 py-3">Plan</th>
              <th className="text-left text-xs text-zinc-500 uppercase px-4 py-3">Usage</th>
              <th className="text-left text-xs text-zinc-500 uppercase px-4 py-3">Props</th>
              <th className="text-left text-xs text-zinc-500 uppercase px-4 py-3">Joined</th>
              <th className="text-left text-xs text-zinc-500 uppercase px-4 py-3">Change Plan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center text-zinc-500 py-8">Loading...</td></tr>
            ) : users.map((u) => {
              const pct = u.callsLimit > 0 ? Math.round((u.callsUsed / u.callsLimit) * 100) : 0;
              return (
                <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{u.email}</div>
                    {u.name && <div className="text-xs text-zinc-500">{u.name}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      u.planId === "plan_premium" ? "bg-purple-900/50 text-purple-300" :
                      u.planId === "plan_pro" ? "bg-blue-900/50 text-blue-300" :
                      "bg-zinc-800 text-zinc-400"
                    }`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">{u.callsUsed}/{u.callsLimit}</span>
                      <span className={pct >= 90 ? "text-red-400" : pct >= 70 ? "text-yellow-400" : "text-green-400"}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    GSC: {u.gscPropertiesCount} / GA4: {u.ga4PropertiesCount}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.planId}
                      disabled={changingPlan === u.id}
                      onChange={(e) => changePlan(u.id, e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1 focus:outline-none"
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
          <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">Page {page} of {Math.ceil(total / 50)}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); fetchUsers(p); }}
                className="px-3 py-1 bg-zinc-800 disabled:opacity-40 text-white rounded text-xs"
              >
                Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / 50)}
                onClick={() => { const p = page + 1; setPage(p); fetchUsers(p); }}
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
