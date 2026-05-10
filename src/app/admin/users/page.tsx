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
  { id: "plan_annual", label: "Annual" },
];

const PAGE_SIZE = 50;

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  const fetchUsers = (p = page, s = search) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
    if (s) params.set("search", s);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(total, page * PAGE_SIZE);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            Manage <span className="accent">accounts.</span>
          </h1>
          <p className="lede">
            Every signup, plan, and connected property in one searchable view. Change plans inline; everything is audited.
          </p>
        </div>
        <div className="actions">
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email..."
              className="input-field"
              style={{ width: 260, padding: "11px 13px" }}
            />
            <button type="submit" className="btn">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="logs-meta">
        <span>
          SHOWING <strong>{start}-{end}</strong> OF <strong>{total.toLocaleString()}</strong>
        </span>
        {search && (
          <>
            <span>·</span>
            <span>
              MATCHING <strong>"{search}"</strong>
            </span>
          </>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>EMAIL</th>
            <th>PLAN</th>
            <th>USAGE</th>
            <th>PROPERTIES</th>
            <th>JOINED</th>
            <th className="right">CHANGE PLAN</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="row-empty">
              <td colSpan={6}>Loading users...</td>
            </tr>
          ) : users.length === 0 ? (
            <tr className="row-empty">
              <td colSpan={6}>No users found</td>
            </tr>
          ) : (
            users.map((u) => {
              const pct = u.callsLimit > 0 ? Math.round((u.callsUsed / u.callsLimit) * 100) : 0;
              const barClass = pct >= 90 ? "error" : pct >= 70 ? "warn" : "";
              const pillKind = u.planId === "plan_annual" ? "success" : "info";
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ color: "var(--ink)", fontWeight: 500 }}>{u.email}</div>
                    {u.name && (
                      <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>
                        {u.name}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`pill ${pillKind}`}>{u.plan}</span>
                  </td>
                  <td style={{ width: 200 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        color: "var(--ink-2)",
                        marginBottom: 6,
                      }}
                    >
                      <span>
                        {u.callsUsed.toLocaleString()} / {u.callsLimit.toLocaleString()}
                      </span>
                      <span
                        style={{
                          color:
                            pct >= 90
                              ? "var(--vermilion)"
                              : pct >= 70
                              ? "var(--amber)"
                              : "var(--green)",
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className={`bar ${barClass}`}>
                      <span style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </td>
                  <td className="mono dim">
                    GSC {u.gscPropertiesCount} · GA4 {u.ga4PropertiesCount}
                  </td>
                  <td className="dim mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="right">
                    <select
                      value={u.planId}
                      disabled={changingPlan === u.id}
                      onChange={(e) => changePlan(u.id, e.target.value)}
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink-2)",
                        padding: "6px 10px",
                        fontFamily: "var(--body)",
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      {PLANS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })
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
              fetchUsers(p);
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
              fetchUsers(p);
            }}
          >
            Next ›
          </button>
        </div>
      </div>
    </>
  );
}
