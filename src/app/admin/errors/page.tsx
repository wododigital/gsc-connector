"use client";
import { useEffect, useState } from "react";

interface ErrorLog {
  id: string;
  timestamp: string;
  tool: string;
  userId: string;
  service: string;
  errorMessage: string | null;
  siteUrl: string;
}

interface ErrorSummary {
  total: number;
  gsc: number;
  ga4: number;
  tokenIssues: number;
}

export default function AdminErrors() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [summary, setSummary] = useState<ErrorSummary>({ total: 0, gsc: 0, ga4: 0, tokenIssues: 0 });
  const [hours, setHours] = useState("24");
  const [service, setService] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchErrors = (h = hours, s = service) => {
    setLoading(true);
    fetch(`/api/admin/errors?hours=${h}&service=${s}`)
      .then((r) => r.json())
      .then((d) => { setErrors(d.errors ?? []); setSummary(d.summary ?? {}); setLoading(false); });
  };

  useEffect(() => { fetchErrors(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Errors &amp; Health</h1>
        <div className="flex gap-2">
          <select
            value={hours}
            onChange={(e) => { setHours(e.target.value); fetchErrors(e.target.value, service); }}
            className="glass-select text-sm"
            style={{ width: "auto", padding: "6px 12px" }}
          >
            <option value="6">Last 6h</option>
            <option value="24">Last 24h</option>
            <option value="48">Last 48h</option>
            <option value="168">Last 7 days</option>
          </select>
          <select
            value={service}
            onChange={(e) => { setService(e.target.value); fetchErrors(hours, e.target.value); }}
            className="glass-select text-sm"
            style={{ width: "auto", padding: "6px 12px" }}
          >
            <option value="all">All Services</option>
            <option value="gsc">GSC</option>
            <option value="ga4">GA4</option>
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Errors", value: summary.total, warn: summary.total > 0 },
          { label: "GSC Errors", value: summary.gsc },
          { label: "GA4 Errors", value: summary.ga4 },
          { label: "Token Issues", value: summary.tokenIssues, warn: summary.tokenIssues > 0 },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ color: s.warn ? "var(--error)" : "var(--text-primary)" }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {summary.tokenIssues > 0 && (
        <div className="glass-card p-4" style={{ borderColor: "var(--warning)" }}>
          <p className="text-sm" style={{ color: "var(--warning)" }}>
            {summary.tokenIssues} token/auth errors detected. Users may need to reconnect their Google accounts.
          </p>
        </div>
      )}

      {/* Error table */}
      <div className="glass-panel overflow-hidden">
        <table className="glass-table">
          <thead>
            <tr>
              {["Time", "User ID", "Service", "Tool", "Error"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                  Loading...
                </td>
              </tr>
            ) : errors.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8" style={{ color: "var(--success)" }}>
                  No errors in this time range
                </td>
              </tr>
            ) : errors.map((e) => (
              <tr key={e.id}>
                <td className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {new Date(e.timestamp).toLocaleString()}
                </td>
                <td className="text-xs truncate max-w-[120px]" style={{ color: "var(--text-secondary)" }}>
                  {e.userId}
                </td>
                <td>
                  <span className={`badge ${e.service === "gsc" ? "badge-info" : "badge-warning"}`}>
                    {e.service.toUpperCase()}
                  </span>
                </td>
                <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                  {e.tool}
                </td>
                <td className="text-xs truncate max-w-xs" style={{ color: "var(--error)" }}>
                  {e.errorMessage ?? "Unknown error"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
