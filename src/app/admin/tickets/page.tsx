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

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "badge-error",
  high: "badge-warning",
  medium: "badge-info",
  low: "badge-muted",
};

const STATUS_BADGE: Record<string, string> = {
  open: "badge-success",
  in_progress: "badge-info",
  resolved: "badge-muted",
  closed: "badge-muted",
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
      .then((d) => { setTickets(d.tickets ?? []); setLoading(false); });
  };

  const fetchDetail = (ticketId: string) => {
    fetch(`/api/admin/tickets/${ticketId}`)
      .then((r) => r.json())
      .then((d) => setSelected(d.ticket));
  };

  useEffect(() => { fetchTickets(); }, []);

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
    <div className="space-y-4">
      <h1 className="page-title">Support Tickets</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); fetchTickets(s); }}
            className={statusFilter === s ? "btn-primary btn-primary-sm capitalize" : "btn-ghost btn-ghost-sm capitalize"}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-4" style={{ height: "calc(100vh - 220px)" }}>
        {/* Ticket list */}
        <div className="w-80 flex-shrink-0 glass-panel overflow-y-auto">
          {loading ? (
            <div className="text-sm p-4" style={{ color: "var(--text-muted)" }}>Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-sm p-4" style={{ color: "var(--text-muted)" }}>No tickets</div>
          ) : tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => fetchDetail(t.id)}
              className="p-3 cursor-pointer"
              style={{
                borderBottom: "1px solid var(--glass-border)",
                background: selected?.id === t.id ? "var(--glass-bg-active)" : "transparent",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`badge ${PRIORITY_BADGE[t.priority] ?? "badge-muted"}`}>
                  {t.priority}
                </span>
                <span className={`badge ${STATUS_BADGE[t.status] ?? "badge-muted"}`}>
                  {t.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                {t.subject}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t.user.email}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {new Date(t.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {/* Ticket detail */}
        {selected ? (
          <div className="flex-1 glass-panel flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4" style={{ borderBottom: "1px solid var(--glass-border)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {selected.subject}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {selected.user.email} - {selected.category}
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selected.priority}
                    onChange={(e) => changePriority(e.target.value)}
                    className="glass-select text-xs"
                    style={{ padding: "4px 8px", width: "auto" }}
                  >
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <select
                    value={selected.status}
                    onChange={(e) => changeStatus(e.target.value)}
                    className="glass-select text-xs"
                    style={{ padding: "4px 8px", width: "auto" }}
                  >
                    {["open", "in_progress", "resolved", "closed"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {selected.messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderType === "admin" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-lg rounded-lg px-4 py-2 text-sm"
                    style={{
                      background: m.senderType === "admin"
                        ? "rgba(0, 179, 179, 0.12)"
                        : "rgba(14, 20, 32, 0.7)",
                      border: `1px solid ${m.senderType === "admin" ? "var(--glass-border-accent)" : "var(--glass-border)"}`,
                    }}
                  >
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                      {m.senderType === "admin" ? "Admin" : selected.user.email} - {new Date(m.createdAt).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                      {m.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply area */}
            <div className="p-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply..."
                className="glass-textarea text-sm"
                style={{ height: "80px", resize: "none" }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => sendReply(false)}
                  disabled={!reply.trim() || sending}
                  className="btn-ghost btn-ghost-sm"
                >
                  Reply
                </button>
                <button
                  onClick={() => sendReply(true)}
                  disabled={!reply.trim() || sending}
                  className="btn-primary btn-primary-sm"
                >
                  Reply + Resolve
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 glass-panel flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
            Select a ticket to view
          </div>
        )}
      </div>
    </div>
  );
}
