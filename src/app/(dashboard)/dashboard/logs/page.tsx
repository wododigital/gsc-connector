import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Usage Logs - OMG AI",
};

interface LogsPageProps {
  searchParams: Promise<{
    tool?: string;
    site?: string;
    days?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 50;

async function getLogs(
  userId: string,
  filters: { tool?: string; site?: string; days?: number; page?: number }
) {
  try {
    const { tool, site, days = 30, page = 1 } = filters;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where = {
      userId,
      createdAt: { gte: since },
      ...(tool ? { toolName: tool } : {}),
      ...(site ? { siteUrl: { contains: site } } : {}),
    };

    const [logs, total, toolCounts, siteCounts, avgAgg] = await Promise.all([
      db.usageLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.usageLog.count({ where }),
      db.usageLog.groupBy({
        by: ["toolName"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      db.usageLog.groupBy({
        by: ["siteUrl"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      db.usageLog.aggregate({ where, _avg: { responseTimeMs: true } }),
    ]);

    const avgResponseTimeMs = avgAgg._avg.responseTimeMs
      ? Math.round(avgAgg._avg.responseTimeMs)
      : null;

    return { logs, total, toolCounts, siteCounts, avgResponseTimeMs, page, pageSize: PAGE_SIZE };
  } catch {
    return { logs: [], total: 0, toolCounts: [], siteCounts: [], avgResponseTimeMs: null, page: 1, pageSize: PAGE_SIZE };
  }
}

async function getDistinctTools(userId: string) {
  try {
    const rows = await db.usageLog.findMany({
      where: { userId },
      select: { toolName: true },
      distinct: ["toolName"],
      orderBy: { toolName: "asc" },
    });
    return rows.map((r) => r.toolName);
  } catch {
    return [];
  }
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const params = await searchParams;
  const days = parseInt(params.days ?? "30", 10);
  const page = parseInt(params.page ?? "1", 10);
  const tool = params.tool || undefined;
  const site = params.site || undefined;

  const [{ logs, total, toolCounts, siteCounts, avgResponseTimeMs }, distinctTools] =
    await Promise.all([
      getLogs(session.id, { tool, site, days, page }),
      getDistinctTools(session.id),
    ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const totalCalls = toolCounts.reduce((sum, t) => sum + t._count.id, 0);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = { tool, site, days: String(days), page: "1", ...overrides };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v);
    }
    return `/dashboard/logs?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Usage Logs</h1>
        <p className="page-subtitle">Tool calls made via MCP for your account</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total calls" value={totalCalls.toLocaleString()} sub={`last ${days} days`} />
        <StatCard label="Unique tools" value={toolCounts.length.toString()} sub="used" />
        <StatCard label="Properties" value={siteCounts.length.toString()} sub="queried" />
        <StatCard
          label="Avg response"
          value={avgResponseTimeMs != null ? `${avgResponseTimeMs}ms` : "-"}
          sub="per tool call"
        />
      </div>

      {/* Filters */}
      <form method="GET" action="/dashboard/logs" className="flex flex-wrap gap-3">
        <select name="days" defaultValue={String(days)} className="glass-select text-sm">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>

        <select name="tool" defaultValue={tool ?? ""} className="glass-select text-sm">
          <option value="">All tools</option>
          {distinctTools.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          type="text"
          name="site"
          defaultValue={site ?? ""}
          placeholder="Filter by property URL"
          className="glass-input text-sm"
          style={{ minWidth: "220px", width: "auto" }}
        />

        <button type="submit" className="btn-ghost btn-ghost-sm">Apply</button>

        {(tool || site || days !== 30) && (
          <a href="/dashboard/logs" className="btn-ghost btn-ghost-sm">Clear</a>
        )}
      </form>

      {/* Log table */}
      {logs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No tool calls recorded for this period.
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Tool calls appear here after you use MCP tools via Claude or another AI assistant.
          </p>
        </div>
      ) : (
        <>
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Tool</th>
                    <th>Property</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Time (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        <a
                          href={buildUrl({ tool: log.toolName, page: "1" })}
                          className="font-mono text-sm"
                          style={{ color: "var(--accent)" }}
                        >
                          {log.toolName}
                        </a>
                      </td>
                      <td className="font-mono text-xs truncate max-w-[260px]">
                        <a
                          href={buildUrl({ site: log.siteUrl, page: "1" })}
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {log.siteUrl}
                        </a>
                      </td>
                      <td>
                        <span className="badge badge-muted">{log.source}</span>
                      </td>
                      <td>
                        <span className={`badge ${log.status === "error" ? "badge-error" : "badge-success"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="tabular-nums text-xs" style={{ textAlign: "right", color: "var(--text-muted)" }}>
                        {log.responseTimeMs != null ? `${log.responseTimeMs}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total} results
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <a href={buildUrl({ page: String(page - 1) })} className="btn-ghost btn-ghost-sm">
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a href={buildUrl({ page: String(page + 1) })} className="btn-ghost btn-ghost-sm">
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Top tools breakdown */}
      {toolCounts.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Calls by tool
          </h2>
          <div className="glass-panel overflow-hidden">
            {toolCounts.map(({ toolName, _count }) => {
              const pct = totalCalls > 0 ? (_count.id / totalCalls) * 100 : 0;
              return (
                <div
                  key={toolName}
                  className="flex items-center gap-4 px-4 py-3 last:border-0"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <a
                    href={buildUrl({ tool: toolName, page: "1" })}
                    className="font-mono text-sm w-52 shrink-0 truncate"
                    style={{ color: "var(--accent)" }}
                  >
                    {toolName}
                  </a>
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: "var(--accent)" }}
                    />
                  </div>
                  <span className="tabular-nums w-16 text-right text-sm" style={{ color: "var(--text-muted)" }}>
                    {_count.id.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string;
  sub: string;
  mono?: boolean;
}) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p
        className={`text-lg font-semibold truncate ${mono ? "font-mono text-sm" : ""}`}
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
