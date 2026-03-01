"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages: { message: string; senderType: string }[];
  _count: { messages: number };
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-900/40 text-green-400",
  in_progress: "bg-blue-900/40 text-blue-400",
  resolved: "bg-zinc-800 text-zinc-400",
  closed: "bg-zinc-900 text-zinc-600",
};

const CATEGORIES = ["general", "billing", "technical", "feature_request", "other"];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "general", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchTickets = () => {
    setLoading(true);
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((d) => { setTickets(d.tickets ?? []); setLoading(false); });
  };

  useEffect(() => { fetchTickets(); }, []);

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create ticket");
    } else {
      setForm({ subject: "", category: "general", description: "" });
      setShowForm(false);
      fetchTickets();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-zinc-400 text-sm mt-1">Get help from our team</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + New Ticket
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Create New Ticket</h2>
          <form onSubmit={submitTicket} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief description of your issue"
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none w-48"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your issue in detail..."
                required
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-zinc-500 text-sm">Loading...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400 text-sm">No tickets yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Create a new ticket if you need help.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/dashboard/tickets/${t.id}`}
              className="block bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium text-sm">{t.subject}</h3>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[t.status]}`}>
                  {t.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="capitalize">{t.category.replace("_", " ")}</span>
                <span>-</span>
                <span>{t._count.messages} message{t._count.messages !== 1 ? "s" : ""}</span>
                <span>-</span>
                <span>Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
              </div>
              {t.messages[0] && (
                <p className="text-xs text-zinc-600 mt-2 line-clamp-1">{t.messages[0].message}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
