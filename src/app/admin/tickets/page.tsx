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

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-400 bg-red-900/30",
  high: "text-orange-400 bg-orange-900/30",
  medium: "text-yellow-400 bg-yellow-900/30",
  low: "text-zinc-400 bg-zinc-800",
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-green-400 bg-green-900/30",
  in_progress: "text-blue-400 bg-blue-900/30",
  resolved: "text-zinc-400 bg-zinc-800",
  closed: "text-zinc-600 bg-zinc-900",
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
      <div className="flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); fetchTickets(s); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === s ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Ticket List */}
        <div className="w-80 flex-shrink-0 bg-zinc-900 border border-zinc-800 rounded-lg overflow-y-auto">
          {loading ? (
            <div className="text-zinc-500 text-sm p-4">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-zinc-500 text-sm p-4">No tickets</div>
          ) : tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => fetchDetail(t.id)}
              className={`p-3 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/50 ${selected?.id === t.id ? "bg-zinc-800" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[t.priority]}`}>
                  {t.priority}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[t.status]}`}>
                  {t.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-white truncate">{t.subject}</p>
              <p className="text-xs text-zinc-500 mt-1">{t.user.email}</p>
              <p className="text-xs text-zinc-600">{new Date(t.updatedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        {/* Ticket Detail */}
        {selected ? (
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{selected.subject}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{selected.user.email} - {selected.category}</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selected.priority}
                    onChange={(e) => changeStatus(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1"
                  >
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <select
                    value={selected.status}
                    onChange={(e) => changeStatus(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1"
                  >
                    {["open", "in_progress", "resolved", "closed"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {selected.messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderType === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-lg rounded-lg px-4 py-2 text-sm ${
                    m.senderType === "admin" ? "bg-blue-900/50 text-blue-100" : "bg-zinc-800 text-zinc-200"
                  }`}>
                    <p className="text-xs opacity-60 mb-1">
                      {m.senderType === "admin" ? "Admin" : selected.user.email} - {new Date(m.createdAt).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none h-20"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => sendReply(false)}
                  disabled={!reply.trim() || sending}
                  className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm disabled:opacity-40"
                >
                  Reply
                </button>
                <button
                  onClick={() => sendReply(true)}
                  disabled={!reply.trim() || sending}
                  className="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm disabled:opacity-40"
                >
                  Reply + Resolve
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 text-sm">
            Select a ticket to view
          </div>
        )}
      </div>
    </div>
  );
}
