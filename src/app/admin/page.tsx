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
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader />
        <div className="surface-card" style={{ textAlign: "center", padding: "48px 24px", color: "var(--ink-3)" }}>
          Loading admin overview...
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageHeader />
        <div className="admin-alert">
          <p className="err">Failed to load admin dashboard. Try refreshing.</p>
        </div>
      </>
    );
  }

  const showAlert = data.errorsToday > 10 || data.openTickets > 5;

  return (
    <>
      <PageHeader />

      {showAlert && (
        <div className="admin-alert">
          {data.errorsToday > 10 && (
            <p className="err">
              {data.errorsToday} errors today. Check the Errors panel.
            </p>
          )}
          {data.openTickets > 5 && (
            <p className="warn">
              {data.openTickets} open tickets need attention.
            </p>
          )}
        </div>
      )}

      {/* KPI grid (matches dashboard demo .stats-row) */}
      <div className="stats-row">
        <div className="stat">
          <div className="label">Total Users</div>
          <div className="num">{data.totalUsers.toLocaleString()}</div>
          <div className="sub">+{data.newUsersToday} today</div>
        </div>
        <div className="stat">
          <div className="label">Open Tickets</div>
          <div className={`num ${data.openTickets > 5 ? "amber" : ""}`}>
            {data.openTickets.toLocaleString()}
          </div>
          <div className="sub">
            <Link href="/admin/tickets" style={{ color: "var(--teal)", textDecoration: "none" }}>
              View queue ↗
            </Link>
          </div>
        </div>
        <div className="stat">
          <div className="label">Errors Today</div>
          <div className={`num ${data.errorsToday > 10 ? "vermilion" : data.errorsToday > 0 ? "amber" : ""}`}>
            {data.errorsToday.toLocaleString()}
          </div>
          <div className="sub">
            <Link href="/admin/errors" style={{ color: "var(--teal)", textDecoration: "none" }}>
              Inspect ↗
            </Link>
          </div>
        </div>
        <div className="stat">
          <div className="label">Calls Today</div>
          <div className="num teal">{data.callsToday.toLocaleString()}</div>
          <div className="sub">tool invocations</div>
        </div>
      </div>

      {/* Section header */}
      <div className="section-header">
        <h2>Detail</h2>
        <div className="right">
          <span>LIVE</span>
        </div>
      </div>

      {/* Detail panels rendered as data tables for visual consistency */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "16px",
        }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th colSpan={2}>Tool Calls</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Today", value: data.callsToday },
              { label: "This Week", value: data.callsThisWeek },
              { label: "This Month", value: data.callsThisMonth },
            ].map((row) => (
              <tr key={row.label}>
                <td className="dim">{row.label}</td>
                <td className="right mono">{row.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="data-table">
          <thead>
            <tr>
              <th colSpan={2}>Plan Distribution</th>
            </tr>
          </thead>
          <tbody>
            {data.planDistribution.length === 0 ? (
              <tr className="row-empty">
                <td colSpan={2}>No plans recorded</td>
              </tr>
            ) : (
              data.planDistribution.map((p) => (
                <tr key={p.planId}>
                  <td>{p.planName}</td>
                  <td className="right mono">{p.count.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <table className="data-table">
          <thead>
            <tr>
              <th colSpan={2}>Top Tools (7d)</th>
            </tr>
          </thead>
          <tbody>
            {data.topTools.length === 0 ? (
              <tr className="row-empty">
                <td colSpan={2}>No tool calls yet</td>
              </tr>
            ) : (
              data.topTools.slice(0, 7).map((t) => (
                <tr key={t.toolName}>
                  <td className="mono" style={{ color: "var(--ink)" }}>{t.toolName}</td>
                  <td className="right mono">{t.count.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .data-table + .data-table { margin-top: 16px; }
          div[style*='grid-template-columns: repeat(3'] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

function PageHeader() {
  return (
    <div className="page-header">
      <div>
        <h1>
          Control <span className="accent">room.</span>
        </h1>
        <p className="lede">
          Realtime view of platform health, user growth, and the support queue. Drill into any
          KPI for the full breakdown.
        </p>
      </div>
      <div className="actions">
        <Link href="/admin/users" className="btn">
          Manage Users
        </Link>
        <Link href="/admin/errors" className="btn btn-primary">
          Errors Panel
        </Link>
      </div>
    </div>
  );
}
