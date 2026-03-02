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

  if (loading) return (
    <div className="text-sm p-4" style={{ color: "var(--text-secondary)" }}>Loading...</div>
  );
  if (!data) return (
    <div className="text-sm p-4" style={{ color: "var(--error)" }}>Failed to load dashboard</div>
  );

  const showAlert = data.errorsToday > 10 || data.openTickets > 5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview</p>
      </div>

      {showAlert && (
        <div className="glass-card p-4" style={{ borderColor: "var(--error)" }}>
          {data.errorsToday > 10 && (
            <p className="text-sm" style={{ color: "var(--error)" }}>
              {data.errorsToday} errors today - check the Errors page.
            </p>
          )}
          {data.openTickets > 5 && (
            <p className="text-sm" style={{ color: "var(--warning)" }}>
              {data.openTickets} open tickets need attention.
            </p>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: data.totalUsers, sub: `+${data.newUsersToday} today` },
          { label: "Open Tickets", value: data.openTickets, href: "/admin/tickets" },
          { label: "Errors Today", value: data.errorsToday, href: "/admin/errors", warn: data.errorsToday > 0 },
          { label: "Calls Today", value: data.callsToday },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
              {kpi.label}
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ color: kpi.warn ? "var(--error)" : "var(--text-primary)" }}
            >
              {kpi.value.toLocaleString()}
            </p>
            {kpi.sub && (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{kpi.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Detail panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Tool Calls
          </p>
          {[
            { label: "Today", value: data.callsToday },
            { label: "This Week", value: data.callsThisWeek },
            { label: "This Month", value: data.callsThisMonth },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between py-2 last:border-0"
              style={{ borderBottom: "1px solid var(--glass-border)" }}
            >
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{row.label}</span>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {row.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Plan Distribution
          </p>
          {data.planDistribution.map((p) => (
            <div
              key={p.planId}
              className="flex justify-between py-2 last:border-0"
              style={{ borderBottom: "1px solid var(--glass-border)" }}
            >
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.planName}</span>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.count}</span>
            </div>
          ))}
        </div>

        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Top Tools (7 days)
          </p>
          {data.topTools.slice(0, 7).map((t) => (
            <div
              key={t.toolName}
              className="flex justify-between py-2 last:border-0"
              style={{ borderBottom: "1px solid var(--glass-border)" }}
            >
              <span className="text-sm truncate mr-2" style={{ color: "var(--text-secondary)" }}>
                {t.toolName}
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
