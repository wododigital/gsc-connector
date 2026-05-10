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

const STATUS_PILL: Record<string, string> = {
  open: "success",
  in_progress: "info",
  resolved: "warn",
  closed: "warn",
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

  useEffect(() => { fetchTicket(); /* eslint-disable-next-line */ }, [ticketId]);

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

  if (loading) {
    return <div style={{ padding: 36, color: "var(--ink-3)" }}>Loading ticket...</div>;
  }
  if (!ticket) {
    return <div style={{ padding: 36, color: "var(--vermilion)" }}>Ticket not found.</div>;
  }

  const canReply = ticket.status === "open" || ticket.status === "in_progress";

  return (
    <>
      <style>{TICKET_CSS}</style>

      <div className="page-header">
        <div>
          <div className="eyebrow">
            <Link href="/dashboard/tickets" style={{ color: "var(--ink-3)", textDecoration: "none" }}>
              SUPPORT
            </Link>
            <span>/</span>
            <span>TICKET #{ticket.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <h1>{ticket.subject}</h1>
          <p className="lede">
            {ticket.category.replace("_", " ").toUpperCase()} · OPENED{" "}
            {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="actions">
          <span className={`pill ${STATUS_PILL[ticket.status] ?? ""}`}>
            {ticket.status.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      <div className="ticket-thread">
        {ticket.messages.map((m) => (
          <div
            key={m.id}
            className={`ticket-msg${m.senderType === "admin" ? " admin" : " user"}`}
          >
            <div className="ticket-msg-head">
              <span className="ticket-msg-who">
                {m.senderType === "admin" ? "SUPPORT TEAM" : "YOU"}
              </span>
              <span className="ticket-msg-when">
                {new Date(m.createdAt).toLocaleString()}
              </span>
            </div>
            <p>{m.message}</p>
          </div>
        ))}
      </div>

      {canReply ? (
        <form onSubmit={sendReply} className="ticket-reply">
          <label className="input-label">REPLY</label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            rows={4}
            className="input-field"
          />
          {error && <p className="ticket-reply-error">{error}</p>}
          <div className="ticket-reply-actions">
            <button type="submit" disabled={!reply.trim() || sending} className="btn btn-primary">
              {sending ? "SENDING..." : "SEND REPLY"}
            </button>
          </div>
        </form>
      ) : (
        <div className="ticket-closed">
          This ticket is {ticket.status}. Open a new ticket if you need further assistance.
        </div>
      )}
    </>
  );
}

const TICKET_CSS = `
.ticket-thread {
  display: flex; flex-direction: column; gap: 12px;
  margin-bottom: 24px;
}
.ticket-msg {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 16px 18px;
  max-width: 75%;
}
.ticket-msg.admin {
  align-self: flex-start;
}
.ticket-msg.user {
  align-self: flex-end;
  border-color: var(--card-rule);
}
.ticket-msg-head {
  display: flex; justify-content: space-between;
  font-size: 10px; letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 8px;
}
.ticket-msg-who { color: var(--teal); font-weight: 500; }
.ticket-msg p {
  font-size: 13px;
  color: var(--ink);
  white-space: pre-wrap;
  line-height: 1.55;
}

.ticket-reply {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 18px;
}
.ticket-reply-error {
  margin-top: 10px;
  color: var(--vermilion);
  font-size: 12px;
}
.ticket-reply-actions {
  margin-top: 14px;
  display: flex; justify-content: flex-end;
}
.ticket-closed {
  padding: 24px;
  text-align: center;
  background: var(--surface-1);
  border: 1px dashed var(--rule-strong);
  color: var(--ink-3);
  font-size: 13px;
}
`;
