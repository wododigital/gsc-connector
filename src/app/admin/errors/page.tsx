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
        <h1 className="text-2xl font-bold text-white">Errors & Health</h1>
        <div className="flex gap-2">
          <select
            value={hours}
            onChange={(e) => { setHours(e.target.value); fetchErrors(e.target.value, service); }}
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="6">Last 6h</option>
            <option value="24">Last 24h</option>
            <option value="48">Last 48h</option>
            <option value="168">Last 7 days</option>
          </select>
          <select
            value={service}
            onChange={(e) => { setService(e.target.value); fetchErrors(hours, e.target.value); }}
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Services</option>
            <option value="gsc">GSC</option>
            <option value="ga4">GA4</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Errors", value: summary.total, warn: summary.total > 0 },
          { label: "GSC Errors", value: summary.gsc },
          { label: "GA4 Errors", value: summary.ga4 },
          { label: "Token Issues", value: summary.tokenIssues, warn: summary.tokenIssues > 0 },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.warn ? "text-red-400" : "text-white"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {summary.tokenIssues > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 text-yellow-300 text-sm">
          {summary.tokenIssues} token/auth errors detected. Users may need to reconnect their Google accounts.
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Time", "User ID", "Service", "Tool", "Error"].map((h) => (
                <th key={h} className="text-left text-xs text-zinc-500 uppercase px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center text-zinc-500 py-8">Loading...</td></tr>
            ) : errors.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-green-400 py-8">No errors in this time range</td></tr>
            ) : errors.map((e) => (
              <tr key={e.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                  {new Date(e.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400 truncate max-w-[120px]">{e.userId}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    e.service === "gsc" ? "bg-blue-900/40 text-blue-400" : "bg-orange-900/40 text-orange-400"
                  }`}>
                    {e.service.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-300 font-mono">{e.tool}</td>
                <td className="px-4 py-3 text-xs text-red-400 truncate max-w-xs">
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
