"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  totalUsers: number;
  newUsersToday: number;
  openTickets: number;
  errorsToday: number;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  planDistribution: { planId: string; planName: string; count: number }[];
  topTools: { toolName: string; count: number }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="text-zinc-400 p-4">Loading...</div>;
  if (!data) return <div className="text-red-400 p-4">Failed to load dashboard</div>;

  const showAlert = data.errorsToday > 10 || data.openTickets > 5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Platform overview</p>
      </div>

      {showAlert && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
          {data.errorsToday > 10 && <p>{data.errorsToday} errors today - check the Errors page.</p>}
          {data.openTickets > 5 && <p>{data.openTickets} open tickets need attention.</p>}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: data.totalUsers, sub: `+${data.newUsersToday} today` },
          { label: "Open Tickets", value: data.openTickets, href: "/admin/tickets" },
          { label: "Errors Today", value: data.errorsToday, href: "/admin/errors", warn: data.errorsToday > 0 },
          { label: "Calls Today", value: data.callsToday },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 ${kpi.warn ? "text-red-400" : "text-white"}`}>
              {kpi.value.toLocaleString()}
            </p>
            {kpi.sub && <p className="text-xs text-zinc-500 mt-1">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Tool Calls</p>
          {[
            { label: "Today", value: data.callsToday },
            { label: "This Week", value: data.callsThisWeek },
            { label: "This Month", value: data.callsThisMonth },
          ].map((row) => (
            <div key={row.label} className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
              <span className="text-sm text-zinc-400">{row.label}</span>
              <span className="text-sm font-medium text-white">{row.value.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Plan Distribution</p>
          {data.planDistribution.map((p) => (
            <div key={p.planId} className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
              <span className="text-sm text-zinc-400">{p.planName}</span>
              <span className="text-sm font-medium text-white">{p.count}</span>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Top Tools (7 days)</p>
          {data.topTools.slice(0, 7).map((t) => (
            <div key={t.toolName} className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
              <span className="text-sm text-zinc-400 truncate mr-2">{t.toolName}</span>
              <span className="text-sm font-medium text-white">{t.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
