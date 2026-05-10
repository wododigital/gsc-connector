"use client";
import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: { email: string; name: string | null };
  messages: { message: string; senderType: string; createdAt: string }[];
  _count: { messages: number };
}

interface TicketDetail extends Ticket {
  messages: { id: string; message: string; senderType: string; createdAt: string; userId: string | null }[];
}

const STATUS_FILTERS = ["all", "open", "in_progress", "resolved", "closed"];

const PRIORITY_PILL: Record<string, string> = {
  urgent: "error",
  high: "warn",
  medium: "info",
  low: "info",
};

const STATUS_PILL: Record<string, string> = {
  open: "success",
  in_progress: "info",
  resolved: "warn",
  closed: "warn",
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState("open");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchTickets = (status = statusFilter) => {
    setLoading(true);
    fetch(`/api/admin/tickets?status=${status}`)
      .then((r) => r.json())
      .then((d) => {
        setTickets(d.tickets ?? []);
        setLoading(false);
      });
  };

  const fetchDetail = (ticketId: string) => {
    fetch(`/api/admin/tickets/${ticketId}`)
      .then((r) => r.json())
      .then((d) => setSelected(d.ticket));
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendReply = async (markResolved = false) => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    await fetch(`/api/admin/tickets/${selected.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim(), markResolved }),
    });
    setReply("");
    fetchDetail(selected.id);
    fetchTickets();
    setSending(false);
  };

  const changeStatus = async (status: string) => {
    if (!selected) return;
    await fetch(`/api/admin/tickets/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchDetail(selected.id);
    fetchTickets();
  };

  const changePriority = async (priority: string) => {
    if (!selected) return;
    await fetch(`/api/admin/tickets/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    fetchDetail(selected.id);
    fetchTickets();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            Support <span className="accent">tickets.</span>
          </h1>
          <p className="lede">
            Reply, escalate, and resolve. Status and priority changes are reflected back to the user
            in their dashboard immediately.
          </p>
        </div>
      </div>

      <div className="filter-bar">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatusFilter(s);
              fetchTickets(s);
            }}
            className={`chip ${statusFilter === s ? "active" : ""}`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="tickets-shell">
        <div className="tickets-list">
          {loading ? (
            <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 12 }}>
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 12 }}>
              No tickets in this view.
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                className={`row ${selected?.id === t.id ? "active" : ""}`}
                onClick={() => fetchDetail(t.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchDetail(t.id);
                }}
              >
                <div className="head">
                  <span className={`pill ${PRIORITY_PILL[t.priority] ?? "info"}`}>
                    {t.priority}
                  </span>
                  <span className={`pill ${STATUS_PILL[t.status] ?? "info"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
                <div className="subject">{t.subject}</div>
                <div className="meta">
                  {t.user.email}
                  <br />
                  {new Date(t.updatedAt).toLocaleDateString()} · {t._count.messages} msg
                </div>
              </div>
            ))
          )}
        </div>

        {selected ? (
          <div className="tickets-detail">
            <div className="head">
              <div>
                <div className="title">{selected.subject}</div>
                <div className="sub">
                  {selected.user.email} · {selected.category}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select
                  value={selected.priority}
                  onChange={(e) => changePriority(e.target.value)}
                  style={selectStyle}
                >
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={selected.status}
                  onChange={(e) => changeStatus(e.target.value)}
                  style={selectStyle}
                >
                  {["open", "in_progress", "resolved", "closed"].map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="messages">
              {selected.messages.map((m) => (
                <div
                  key={m.id}
                  className={`msg ${m.senderType === "admin" ? "admin" : ""}`}
                >
                  <div className="who">
                    {m.senderType === "admin" ? "Admin" : selected.user.email} ·{" "}
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                  <div className="text">{m.message}</div>
                </div>
              ))}
            </div>

            <div className="reply">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply..."
              />
              <div className="actions">
                <button
                  type="button"
                  onClick={() => sendReply(false)}
                  disabled={!reply.trim() || sending}
                  className="btn"
                >
                  {sending ? "Sending..." : "Reply"}
                </button>
                <button
                  type="button"
                  onClick={() => sendReply(true)}
                  disabled={!reply.trim() || sending}
                  className="btn btn-primary"
                >
                  Reply + Resolve
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="tickets-empty">Select a ticket to view</div>
        )}
      </div>
    </>
  );
}

const selectStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--rule)",
  color: "var(--ink-2)",
  padding: "6px 10px",
  fontFamily: "var(--body)",
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
};
