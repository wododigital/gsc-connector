import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Usage Logs - GSC Connect",
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-green-400 font-bold">GSC Connect</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300 text-sm">Usage Logs</span>
        </div>
        <a
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Back to dashboard
        </a>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-100">Usage Logs</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Tool calls made via MCP for your account
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total calls"
            value={totalCalls.toLocaleString()}
            sub={`last ${days} days`}
          />
          <StatCard
            label="Unique tools"
            value={toolCounts.length.toString()}
            sub="used"
          />
          <StatCard
            label="Properties"
            value={siteCounts.length.toString()}
            sub="queried"
          />
          <StatCard
            label="Avg response"
            value={avgResponseTimeMs != null ? `${avgResponseTimeMs}ms` : "-"}
            sub="per tool call"
          />
        </div>

        {/* Filters */}
        <form method="GET" action="/dashboard/logs" className="flex flex-wrap gap-3 mb-6">
          <select
            name="days"
            defaultValue={String(days)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-green-600"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <select
            name="tool"
            defaultValue={tool ?? ""}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-green-600"
          >
            <option value="">All tools</option>
            {distinctTools.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="site"
            defaultValue={site ?? ""}
            placeholder="Filter by property URL"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-600 min-w-[220px]"
          />

          <button
            type="submit"
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm rounded-lg transition-colors"
          >
            Apply
          </button>

          {(tool || site || days !== 30) && (
            <a
              href="/dashboard/logs"
              className="px-4 py-2 bg-transparent border border-zinc-700 hover:border-zinc-600 text-zinc-400 text-sm rounded-lg transition-colors"
            >
              Clear
            </a>
          )}
        </form>

        {/* Log table */}
        {logs.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-500 text-sm">No tool calls recorded for this period.</p>
            <p className="text-zinc-600 text-xs mt-2">
              Tool calls appear here after you use MCP tools via Claude or another AI assistant.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Tool
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Time (ms)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-400 whitespace-nowrap tabular-nums">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={buildUrl({ tool: log.toolName, page: "1" })}
                            className="font-mono text-green-400 hover:text-green-300 transition-colors"
                          >
                            {log.toolName}
                          </a>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-300 text-xs truncate max-w-[260px]">
                          <a
                            href={buildUrl({ site: log.siteUrl, page: "1" })}
                            className="hover:text-zinc-100 transition-colors"
                          >
                            {log.siteUrl}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400">
                            {log.source}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${log.status === "error" ? "bg-red-900/40 text-red-400" : "bg-green-900/30 text-green-500"}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-400 tabular-nums text-xs">
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
              <div className="flex items-center justify-between text-sm text-zinc-500">
                <span>
                  Showing {(page - 1) * PAGE_SIZE + 1}-
                  {Math.min(page * PAGE_SIZE, total)} of {total} results
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <a
                      href={buildUrl({ page: String(page - 1) })}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
                    >
                      Previous
                    </a>
                  )}
                  {page < totalPages && (
                    <a
                      href={buildUrl({ page: String(page + 1) })}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
                    >
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
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Calls by tool
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {toolCounts.map(({ toolName, _count }) => {
                const pct = totalCalls > 0 ? (_count.id / totalCalls) * 100 : 0;
                return (
                  <div
                    key={toolName}
                    className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800/50 last:border-0"
                  >
                    <a
                      href={buildUrl({ tool: toolName, page: "1" })}
                      className="font-mono text-sm text-green-400 hover:text-green-300 w-52 shrink-0 truncate transition-colors"
                    >
                      {toolName}
                    </a>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-zinc-400 text-sm tabular-nums w-16 text-right">
                      {_count.id.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p
        className={`text-lg font-semibold text-zinc-100 truncate ${mono ? "font-mono text-sm" : ""}`}
      >
        {value}
      </p>
      <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
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
