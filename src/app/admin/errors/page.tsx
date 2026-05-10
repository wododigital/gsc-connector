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

const HOUR_OPTIONS = [
  { value: "6", label: "Last 6h" },
  { value: "24", label: "Last 24h" },
  { value: "48", label: "Last 48h" },
  { value: "168", label: "Last 7 days" },
];

const SERVICE_OPTIONS = [
  { value: "all", label: "All Services" },
  { value: "gsc", label: "GSC" },
  { value: "ga4", label: "GA4" },
];

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
      .then((d) => {
        setErrors(d.errors ?? []);
        setSummary(d.summary ?? { total: 0, gsc: 0, ga4: 0, tokenIssues: 0 });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <span className="num">05</span>
            <span>·</span>
            <span>ADMIN · ERRORS &amp; HEALTH</span>
          </div>
          <h1>
            System <span className="accent">errors.</span>
          </h1>
          <p className="lede">
            Live error stream from the GSC and GA4 tool runners. Token issues usually mean a user
            needs to reconnect Google.
          </p>
        </div>
        <div className="actions">
          <select
            value={hours}
            onChange={(e) => {
              setHours(e.target.value);
              fetchErrors(e.target.value, service);
            }}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--rule)",
              color: "var(--ink-2)",
              padding: "11px 14px",
              fontFamily: "var(--body)",
              fontSize: 12,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {HOUR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={service}
            onChange={(e) => {
              setService(e.target.value);
              fetchErrors(hours, e.target.value);
            }}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--rule)",
              color: "var(--ink-2)",
              padding: "11px 14px",
              fontFamily: "var(--body)",
              fontSize: 12,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {SERVICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-row">
        <div className="stat">
          <div className="label">Total Errors</div>
          <div className={`num ${summary.total > 10 ? "vermilion" : summary.total > 0 ? "amber" : ""}`}>
            {summary.total.toLocaleString()}
          </div>
          <div className="sub">in window</div>
        </div>
        <div className="stat">
          <div className="label">GSC Errors</div>
          <div className="num">{summary.gsc.toLocaleString()}</div>
          <div className="sub">search console</div>
        </div>
        <div className="stat">
          <div className="label">GA4 Errors</div>
          <div className="num">{summary.ga4.toLocaleString()}</div>
          <div className="sub">analytics</div>
        </div>
        <div className="stat">
          <div className="label">Token Issues</div>
          <div className={`num ${summary.tokenIssues > 0 ? "vermilion" : ""}`}>
            {summary.tokenIssues.toLocaleString()}
          </div>
          <div className="sub">auth failures</div>
        </div>
      </div>

      {summary.tokenIssues > 0 && (
        <div className="admin-alert">
          <p className="warn">
            {summary.tokenIssues} token or auth errors detected. Affected users may need to
            reconnect their Google accounts.
          </p>
        </div>
      )}

      <div className="section-header">
        <h2>Error Stream</h2>
        <div className="right">
          <span>WINDOW {HOUR_OPTIONS.find((o) => o.value === hours)?.label}</span>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>TIMESTAMP</th>
            <th>USER</th>
            <th>SERVICE</th>
            <th>TOOL</th>
            <th>ERROR</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="row-empty">
              <td colSpan={5}>Loading error stream...</td>
            </tr>
          ) : errors.length === 0 ? (
            <tr className="row-empty row-good">
              <td colSpan={5}>All clear in this window</td>
            </tr>
          ) : (
            errors.map((e) => (
              <tr key={e.id}>
                <td className="dim mono">{new Date(e.timestamp).toLocaleString()}</td>
                <td
                  className="dim mono"
                  style={{
                    maxWidth: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={e.userId}
                >
                  {e.userId}
                </td>
                <td>
                  <span className={`pill ${e.service === "gsc" ? "info" : "warn"}`}>
                    {e.service.toUpperCase()}
                  </span>
                </td>
                <td className="mono">{e.tool}</td>
                <td
                  style={{
                    maxWidth: 360,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "var(--vermilion)",
                  }}
                  title={e.errorMessage ?? ""}
                >
                  {e.errorMessage ?? "Unknown error"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
