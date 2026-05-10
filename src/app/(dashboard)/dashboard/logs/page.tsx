import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Usage Logs - OMG Bridge",
};

interface LogsPageProps {
  searchParams: Promise<{
    tool?: string;
    site?: string;
    days?: string;
    page?: string;
    source?: string;
  }>;
}

const PAGE_SIZE = 50;

async function getLogs(
  userId: string,
  filters: { tool?: string; site?: string; source?: string; days?: number; page?: number }
) {
  try {
    const { tool, site, source, days = 30, page = 1 } = filters;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where = {
      userId,
      createdAt: { gte: since },
      ...(tool ? { toolName: tool } : {}),
      ...(site ? { siteUrl: { contains: site } } : {}),
      ...(source ? { source } : {}),
    };

    // First pass: things that don't depend on total.
    const [logs, total, sourceCounts, avgAgg, successCount] = await Promise.all([
      db.usageLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.usageLog.count({ where }),
      db.usageLog.groupBy({
        by: ["source"],
        where: { userId, createdAt: { gte: since } },
        _count: { id: true },
      }),
      db.usageLog.aggregate({ where, _avg: { responseTimeMs: true } }),
      db.usageLog.count({ where: { ...where, status: "success" } }).catch(() => 0),
    ]);

    // Second pass: p95 needs `total` to know how many top rows to fetch.
    const p95Take = Math.max(1, Math.ceil(total * 0.05));
    const p95Agg = total === 0
      ? ([] as { responseTimeMs: number | null }[])
      : await db.usageLog
          .findMany({
            where,
            select: { responseTimeMs: true },
            orderBy: { responseTimeMs: "desc" },
            take: p95Take,
          })
          .catch(() => [] as { responseTimeMs: number | null }[]);

    const avgMs = avgAgg._avg.responseTimeMs ? Math.round(avgAgg._avg.responseTimeMs) : null;
    const p95Ms =
      p95Agg.length > 0 && p95Agg[p95Agg.length - 1].responseTimeMs != null
        ? Math.round(p95Agg[p95Agg.length - 1].responseTimeMs as number)
        : null;
    const successRate = total > 0 ? (successCount / total) * 100 : 100;

    return { logs, total, sourceCounts, avgMs, p95Ms, successRate, page, pageSize: PAGE_SIZE };
  } catch {
    return {
      logs: [], total: 0, sourceCounts: [],
      avgMs: null, p95Ms: null, successRate: 100,
      page: 1, pageSize: PAGE_SIZE,
    };
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

/* Inline AI brand SVGs (kept local to avoid extra files). */
const ClaudeIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.64445 2.55279C8.39746 2.05881 7.79679 1.85859 7.30281 2.10558C6.80883 2.35257 6.60861 2.95324 6.8556 3.44722L9.68128 9.09859L5.06655 5.92596C4.61145 5.61308 3.98887 5.72837 3.67598 6.18348C3.3631 6.63858 3.47839 7.26116 3.9335 7.57405L9.40503 11.3357L3.05258 11.0014C2.50106 10.9724 2.03043 11.3959 2.00141 11.9474C1.97238 12.499 2.39594 12.9696 2.94747 12.9986L8.74187 13.3036L4.44532 16.168C3.9858 16.4743 3.86162 17.0952 4.16797 17.5547C4.47433 18.0142 5.0952 18.1384 5.55473 17.8321L9.19687 15.404L6.68629 18.9188C6.36528 19.3682 6.46937 19.9927 6.91879 20.3137C7.3682 20.6347 7.99275 20.5307 8.31376 20.0812L11.3471 15.8345L10.5136 20.8356C10.4228 21.3804 10.7909 21.8956 11.3356 21.9864C11.8804 22.0772 12.3956 21.7092 12.4864 21.1644L13.2883 16.3532L15.6588 20.0408C15.9575 20.5053 16.5762 20.6398 17.0408 20.3412C17.5054 20.0425 17.6399 19.4238 17.3412 18.9592L15.5553 16.1812L18.3217 18.7348C18.7276 19.1094 19.3602 19.0841 19.7348 18.6783C20.1094 18.2725 20.0841 17.6398 19.6783 17.2652L16.6427 14.4631L20.876 14.9923C21.424 15.0608 21.9238 14.6721 21.9923 14.124C22.0608 13.576 21.6721 13.0762 21.1241 13.0077L16.9342 12.484L21.2291 11.4734C21.7667 11.3469 22.0999 10.8086 21.9734 10.271C21.8469 9.73336 21.3086 9.40009 20.771 9.52659L15.1819 10.8417L19.2863 5.61783C19.6276 5.18356 19.5521 4.5549 19.1178 4.21369C18.6836 3.87247 18.0549 3.94791 17.7137 4.38218L13.8574 9.29015L14.738 3.65438C14.8233 3.10872 14.4501 2.59725 13.9044 2.51199C13.3587 2.42673 12.8473 2.79996 12.762 3.34563L11.876 9.01594L8.64445 2.55279Z" /></svg>
);
const ChatGPTIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" /></svg>
);
const GeminiIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81Z" /></svg>
);
const CursorIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" /></svg>
);

function aiBrandFor(source: string): { tone: string; label: string; icon: React.ReactNode } {
  const s = (source || "").toLowerCase();
  if (s.includes("claude")) return { tone: "claude", label: "Claude", icon: ClaudeIcon };
  if (s.includes("chatgpt") || s.includes("openai")) return { tone: "chatgpt", label: "ChatGPT", icon: ChatGPTIcon };
  if (s.includes("gemini") || s.includes("google-ai")) return { tone: "gemini", label: "Gemini", icon: GeminiIcon };
  if (s.includes("cursor")) return { tone: "cursor", label: "Cursor", icon: CursorIcon };
  return { tone: "cursor", label: source || "Unknown", icon: CursorIcon };
}

function statusPill(status: string): { tone: string; label: string } {
  const s = (status || "").toLowerCase();
  if (s === "success") return { tone: "success", label: "200" };
  if (s === "error") return { tone: "error", label: "ERR" };
  return { tone: "warn", label: status.toUpperCase() };
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const params = await searchParams;
  const days = parseInt(params.days ?? "7", 10);
  const page = parseInt(params.page ?? "1", 10);
  const tool = params.tool || undefined;
  const site = params.site || undefined;
  const source = params.source || undefined;

  const [{ logs, total, sourceCounts, avgMs, p95Ms, successRate }, distinctTools] =
    await Promise.all([
      getLogs(session.id, { tool, site, source, days, page }),
      getDistinctTools(session.id),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = {
      tool, site, source, days: String(days), page: "1",
      ...overrides,
    };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v);
    }
    return `/dashboard/logs?${sp.toString()}`;
  }

  // Source counts as a lookup for filter pill display.
  const sourceCountMap: Record<string, number> = {};
  for (const sc of sourceCounts) sourceCountMap[sc.source] = sc._count.id;

  const filterPills = [
    { id: "all", label: "ALL", count: total },
    { id: "claude.ai", label: "CLAUDE", count: sourceCountMap["claude.ai"] ?? 0 },
    { id: "chatgpt.com", label: "CHATGPT", count: sourceCountMap["chatgpt.com"] ?? 0 },
    { id: "gemini", label: "GEMINI", count: sourceCountMap["gemini"] ?? 0 },
    { id: "cursor", label: "CURSOR", count: sourceCountMap["cursor"] ?? 0 },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Every query, <span className="accent">tracked.</span></h1>
          <p className="lede">
            Audit-ready log of every tool call your bridge has handled. Filter by tool, AI, status or property.
          </p>
        </div>
        <div className="actions">
          <a className="btn" href="/dashboard/logs?days=7" aria-disabled="true" title="Export coming soon">EXPORT CSV ↗</a>
        </div>
      </div>

      {/* Filter bar */}
      <form
        method="GET"
        action="/dashboard/logs"
        style={{
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
          padding: "14px 16px", background: "var(--surface-1)",
          border: "1px solid var(--rule-strong)", marginBottom: 0,
        }}
      >
        <input type="hidden" name="days" value={String(days)} />
        <input
          type="text" name="site" defaultValue={site ?? ""}
          placeholder="Search query text or property URL..."
          style={{
            flex: 1, maxWidth: 300,
            background: "var(--bg)", border: "1px solid var(--rule)",
            color: "var(--ink)", padding: "7px 12px",
            fontFamily: "var(--body)", fontSize: 12, outline: "none",
          }}
        />
        {filterPills.map((f) => {
          const isActive = (f.id === "all" && !source) || source === f.id;
          return (
            <a
              key={f.id}
              href={buildUrl({ source: f.id === "all" ? undefined : f.id, page: "1" })}
              style={{
                padding: "6px 12px",
                background: isActive ? "var(--teal)" : "var(--surface-2)",
                color: isActive ? "var(--bg)" : "var(--ink-2)",
                border: `1px solid ${isActive ? "var(--teal)" : "var(--rule)"}`,
                fontSize: 11, letterSpacing: "0.04em",
                textTransform: "uppercase", fontWeight: isActive ? 500 : 400,
                textDecoration: "none",
              }}
            >
              {f.label} · {f.count}
            </a>
          );
        })}
        <span style={{ flex: 1 }} />
        <select
          name="days"
          defaultValue={String(days)}
          style={{
            background: "var(--bg)", border: "1px solid var(--rule)",
            color: "var(--ink-2)", padding: "6px 12px",
            fontFamily: "var(--body)", fontSize: 11, letterSpacing: "0.04em",
            textTransform: "uppercase", outline: "none",
          }}
        >
          <option value="1">LAST 24 HOURS</option>
          <option value="7">LAST 7 DAYS</option>
          <option value="30">LAST 30 DAYS</option>
          <option value="90">LAST 90 DAYS</option>
        </select>
        <select
          name="tool"
          defaultValue={tool ?? ""}
          style={{
            background: "var(--bg)", border: "1px solid var(--rule)",
            color: "var(--ink-2)", padding: "6px 12px",
            fontFamily: "var(--body)", fontSize: 11, letterSpacing: "0.04em",
            textTransform: "uppercase", outline: "none",
          }}
        >
          <option value="">ALL TOOLS</option>
          {distinctTools.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          type="submit"
          className="btn"
          style={{ padding: "6px 14px", fontSize: 11 }}
        >
          APPLY
        </button>
      </form>

      {/* Logs meta strip */}
      <div className="logs-meta">
        <span>SHOWING <strong>{start}-{end}</strong> OF <strong>{total.toLocaleString()}</strong></span>
        <span>·</span>
        <span>SUCCESS RATE <strong style={{ color: "var(--green)" }}>{successRate.toFixed(1)}%</strong></span>
        <span>·</span>
        <span>AVG LATENCY <strong>{avgMs != null ? `${(avgMs / 1000).toFixed(2)}s` : "—"}</strong></span>
        <span>·</span>
        <span>P95 LATENCY <strong>{p95Ms != null ? `${(p95Ms / 1000).toFixed(2)}s` : "—"}</strong></span>
      </div>

      {/* Logs table */}
      {logs.length === 0 ? (
        <div style={{
          padding: 56, textAlign: "center",
          background: "var(--surface-1)",
          border: "1px solid var(--rule-strong)",
          borderTop: "none",
          color: "var(--ink-3)", fontSize: 13,
        }}>
          No tool calls recorded for this period.
          <p style={{ fontSize: 11, marginTop: 6, color: "var(--ink-3)" }}>
            Tool calls appear here after you use MCP tools via Claude or another AI assistant.
          </p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>TIMESTAMP</th>
              <th>FROM</th>
              <th>TOOL</th>
              <th>SERVICE</th>
              <th>PROPERTY</th>
              <th className="right">LATENCY</th>
              <th className="right">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const ai = aiBrandFor(log.source);
              const status = statusPill(log.status);
              return (
                <tr key={log.id}>
                  <td className="dim mono">{formatTimestamp(log.createdAt)}</td>
                  <td>
                    <span className={`ai-mark ${ai.tone}`}>
                      {ai.icon}
                      {ai.label}
                    </span>
                  </td>
                  <td className="mono">{log.toolName}</td>
                  <td className="dim">{log.service?.toUpperCase() ?? "—"}</td>
                  <td className="mono dim">{log.siteUrl ?? "—"}</td>
                  <td className="right mono">
                    {log.responseTimeMs != null ? `${(log.responseTimeMs / 1000).toFixed(2)}s` : "—"}
                  </td>
                  <td className="right">
                    <span className={`pill ${status.tone}`}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <span>PAGE {page} OF {totalPages}</span>
          <div className="pages">
            {page > 1 && (
              <a href={buildUrl({ page: String(page - 1) })}>‹</a>
            )}
            {pageNumbers(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={i}>…</span>
              ) : (
                <a
                  key={p}
                  href={buildUrl({ page: String(p) })}
                  className={p === page ? "active" : ""}
                >
                  {p}
                </a>
              )
            )}
            {page < totalPages && (
              <a href={buildUrl({ page: String(page + 1) })}>›</a>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).format(date);
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const first = 1;
  const last = total;
  const range: (number | "…")[] = [first];
  if (current > 4) range.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    range.push(i);
  }
  if (current < total - 3) range.push("…");
  range.push(last);
  return range;
}
