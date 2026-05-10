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

const STATUS_PILL: Record<string, string> = {
  open: "success",
  in_progress: "info",
  resolved: "warn",
  closed: "warn",
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
    <>
      <style>{TICKETS_CSS}</style>
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <span className="num">08</span>
            <span>·</span>
            <span>SUPPORT · TICKETS</span>
          </div>
          <h1>Get <span className="accent">help.</span></h1>
          <p className="lede">Open a ticket and our team will respond within one business day.</p>
        </div>
        <div className="actions">
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            + NEW TICKET
          </button>
        </div>
      </div>

      {showForm && (
        <div className="ticket-form">
          <h2>CREATE NEW TICKET</h2>
          <form onSubmit={submitTicket}>
            <div className="ticket-form-fields">
              <div>
                <label className="input-label">SUBJECT</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">CATEGORY</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div className="ticket-form-wide">
                <label className="input-label">DESCRIPTION</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  required
                  rows={5}
                  className="input-field"
                />
              </div>
            </div>
            {error && <p className="ticket-error">{error}</p>}
            <div className="ticket-form-actions">
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? "SUBMITTING..." : "SUBMIT TICKET"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn">
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="ticket-state">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="ticket-state">
          No tickets yet. Open a new ticket if you need help.
        </div>
      ) : (
        <div className="ticket-list">
          {tickets.map((t) => (
            <Link key={t.id} href={`/dashboard/tickets/${t.id}`} className="ticket-row">
              <div className="ticket-row-head">
                <h3>{t.subject}</h3>
                <span className={`pill ${STATUS_PILL[t.status] ?? ""}`}>
                  {t.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className="ticket-row-meta">
                <span>{t.category.replace("_", " ").toUpperCase()}</span>
                <span>·</span>
                <span>{t._count.messages} MESSAGE{t._count.messages !== 1 ? "S" : ""}</span>
                <span>·</span>
                <span>UPDATED {new Date(t.updatedAt).toLocaleDateString()}</span>
              </div>
              {t.messages[0] && (
                <p className="ticket-row-preview">{t.messages[0].message}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

const TICKETS_CSS = `
.ticket-form {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 24px;
  margin-bottom: 24px;
}
.ticket-form h2 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink);
  margin-bottom: 18px;
}
.ticket-form-fields {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 16px;
}
.ticket-form-wide { grid-column: 1 / -1; }
.ticket-form-actions {
  margin-top: 16px;
  display: flex; gap: 10px;
}
.ticket-error {
  margin-top: 12px;
  color: var(--vermilion);
  font-size: 12px;
}

.ticket-state {
  padding: 56px 24px;
  text-align: center;
  background: var(--surface-1);
  border: 1px dashed var(--rule-strong);
  color: var(--ink-3);
  font-size: 13px;
}

.ticket-list { display: flex; flex-direction: column; gap: 10px; }
.ticket-row {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 16px 20px;
  display: block;
  text-decoration: none;
  color: inherit;
  transition: border-color .15s;
}
.ticket-row:hover { border-color: var(--teal); }
.ticket-row-head {
  display: flex; justify-content: space-between; align-items: start;
  gap: 16px; margin-bottom: 8px;
}
.ticket-row h3 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.02em;
  color: var(--ink);
}
.ticket-row-meta {
  display: flex; gap: 8px; flex-wrap: wrap;
  font-size: 10px; letter-spacing: 0.14em;
  color: var(--ink-3);
}
.ticket-row-preview {
  margin-top: 8px;
  font-size: 12px;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 980px) {
  .ticket-form-fields { grid-template-columns: 1fr; }
}
`;
