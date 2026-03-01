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

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-900/40 text-green-400",
  in_progress: "bg-blue-900/40 text-blue-400",
  resolved: "bg-zinc-800 text-zinc-400",
  closed: "bg-zinc-900 text-zinc-600",
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

  if (loading) return <div className="text-zinc-500 text-sm p-4">Loading...</div>;
  if (!ticket) return <div className="text-red-400 text-sm p-4">Ticket not found.</div>;

  const canReply = ticket.status === "open" || ticket.status === "in_progress";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tickets" className="text-zinc-500 hover:text-white text-sm transition-colors">
          Tickets
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300 text-sm truncate">{ticket.subject}</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{ticket.subject}</h1>
            <p className="text-xs text-zinc-500 mt-1 capitalize">
              {ticket.category.replace("_", " ")} - opened {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[ticket.status]}`}>
            {ticket.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {ticket.messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderType === "admin" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-md rounded-lg px-4 py-3 ${
              m.senderType === "admin"
                ? "bg-zinc-800 text-zinc-200"
                : "bg-blue-900/50 text-blue-100"
            }`}>
              <p className="text-xs text-zinc-500 mb-1">
                {m.senderType === "admin" ? "Support Team" : "You"} - {new Date(m.createdAt).toLocaleString()}
              </p>
              <p className="text-sm whitespace-pre-wrap">{m.message}</p>
            </div>
          </div>
        ))}
      </div>

      {canReply ? (
        <form onSubmit={sendReply} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
          <label className="text-xs text-zinc-500 block">Reply</label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={!reply.trim() || sending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50 transition-colors">
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </form>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center text-sm text-zinc-500">
          This ticket is {ticket.status}. Open a new ticket if you need further assistance.
        </div>
      )}
    </div>
  );
}
