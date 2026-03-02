"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Message {
  id: string;
  senderType: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  messages: Message[];
}

const STATUS_BADGE: Record<string, string> = {
  open: "badge-success",
  in_progress: "badge-info",
  resolved: "badge-muted",
  closed: "badge-muted",
};

export default function TicketPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fetchTicket = () => {
    fetch(`/api/tickets/${ticketId}`)
      .then((r) => r.json())
      .then((d) => { setTicket(d.ticket); setLoading(false); });
  };

  useEffect(() => { fetchTicket(); }, [ticketId]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setError("");
    setSending(true);
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to send reply");
    } else {
      setReply("");
      fetchTicket();
    }
    setSending(false);
  };

  if (loading) return (
    <div className="text-sm p-4" style={{ color: "var(--text-muted)" }}>Loading...</div>
  );
  if (!ticket) return (
    <div className="text-sm p-4" style={{ color: "var(--error)" }}>Ticket not found.</div>
  );

  const canReply = ticket.status === "open" || ticket.status === "in_progress";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tickets" className="text-sm transition-colors" style={{ color: "var(--text-muted)" }}>
          Tickets
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
          {ticket.subject}
        </span>
      </div>

      {/* Ticket header */}
      <div className="glass-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {ticket.subject}
            </h1>
            <p className="text-xs mt-1 capitalize" style={{ color: "var(--text-muted)" }}>
              {ticket.category.replace("_", " ")} - opened {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className={`badge ${STATUS_BADGE[ticket.status] ?? "badge-muted"}`}>
            {ticket.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {ticket.messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderType === "admin" ? "justify-start" : "justify-end"}`}>
            <div
              className="max-w-md rounded-lg px-4 py-3"
              style={{
                background: m.senderType === "admin"
                  ? "rgba(14, 20, 32, 0.7)"
                  : "rgba(0, 179, 179, 0.12)",
                border: `1px solid ${m.senderType === "admin" ? "var(--glass-border)" : "var(--glass-border-accent)"}`,
              }}
            >
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                {m.senderType === "admin" ? "Support Team" : "You"} - {new Date(m.createdAt).toLocaleString()}
              </p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                {m.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply form or closed notice */}
      {canReply ? (
        <form onSubmit={sendReply} className="glass-card p-4 space-y-3">
          <label className="text-xs block" style={{ color: "var(--text-muted)" }}>Reply</label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
            className="glass-textarea text-sm"
          />
          {error && <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>}
          <button
            type="submit"
            disabled={!reply.trim() || sending}
            className="btn-primary btn-primary-sm"
          >
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </form>
      ) : (
        <div className="glass-card p-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          This ticket is {ticket.status}. Open a new ticket if you need further assistance.
        </div>
      )}
    </div>
  );
}
