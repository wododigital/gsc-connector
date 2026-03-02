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

const STATUS_BADGE: Record<string, string> = {
  open: "badge-success",
  in_progress: "badge-info",
  resolved: "badge-muted",
  closed: "badge-muted",
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
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">Get help from our team</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary btn-primary-sm"
        >
          + New Ticket
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Create New Ticket
          </h2>
          <form onSubmit={submitTicket} className="space-y-4">
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief description of your issue"
                required
                className="glass-input text-sm"
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="glass-select text-sm"
                style={{ width: "192px" }}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your issue in detail..."
                required
                rows={4}
                className="glass-textarea text-sm"
              />
            </div>
            {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary btn-primary-sm">
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost btn-ghost-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : tickets.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No tickets yet.</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Create a new ticket if you need help.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/tickets/${t.id}`}
              className="block glass-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {t.subject}
                </h3>
                <span className={`badge ${STATUS_BADGE[t.status] ?? "badge-muted"}`}>
                  {t.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="capitalize">{t.category.replace("_", " ")}</span>
                <span>-</span>
                <span>{t._count.messages} message{t._count.messages !== 1 ? "s" : ""}</span>
                <span>-</span>
                <span>Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
              </div>
              {t.messages[0] && (
                <p className="text-xs mt-2 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                  {t.messages[0].message}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
