"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface ProRequest {
  id: string;
  name: string;
  orgType: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  notes: string | null;
  contactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_FILTERS = ["all", "new", "contacted", "qualified", "won", "lost"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_PILL: Record<string, string> = {
  new: "info",
  contacted: "warn",
  qualified: "success",
  won: "success",
  lost: "error",
};

const ORG_LABEL: Record<string, string> = {
  startup_brand: "Startup Brand",
  enterprise: "Enterprise Company",
  agency: "Agency",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminProRequests() {
  const [requests, setRequests] = useState<ProRequest[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("new");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProRequest | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async (status: StatusFilter) => {
    setLoading(true);
    const res = await fetch(`/api/admin/pro-requests?status=${status}`);
    const data = await res.json();
    setRequests(data.requests ?? []);
    setCounts(data.counts ?? {});
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchRequests(statusFilter);
  }, [statusFilter, fetchRequests]);

  useEffect(() => {
    setDraftNotes(selected?.notes ?? "");
  }, [selected]);

  const totalNew = counts.new ?? 0;
  const totalAll = useMemo(
    () => Object.values(counts).reduce((s, n) => s + n, 0),
    [counts]
  );

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    const res = await fetch(`/api/admin/pro-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      await fetchRequests(statusFilter);
      setSelected(data.request ?? null);
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/admin/pro-requests/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: draftNotes }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      await fetchRequests(statusFilter);
      setSelected(data.request ?? null);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this enquiry? This cannot be undone.")) return;
    setSaving(true);
    await fetch(`/api/admin/pro-requests/${id}`, { method: "DELETE" });
    setSaving(false);
    setSelected(null);
    await fetchRequests(statusFilter);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            Pro Plan <span className="accent">enquiries.</span>
          </h1>
          <p className="lede">
            Leads from the pricing page <strong>“Request access”</strong> form. Triage, take notes,
            and follow up to activate paid subscriptions.
          </p>
        </div>
        <div className="actions">
          <span className="pill info">{totalNew.toLocaleString()} NEW</span>
          <span className="pill">{totalAll.toLocaleString()} TOTAL</span>
        </div>
      </div>

      <div className="filter-bar">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip${statusFilter === s ? " active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === "all" ? "ALL" : s.toUpperCase()}
            {s !== "all" && counts[s] != null && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>· {counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>RECEIVED</th>
            <th>NAME</th>
            <th>ORGANISATION</th>
            <th>EMAIL</th>
            <th>PHONE</th>
            <th className="right">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="row-empty">
              <td colSpan={6}>Loading enquiries…</td>
            </tr>
          ) : requests.length === 0 ? (
            <tr className="row-empty">
              <td colSpan={6}>No enquiries match this filter.</td>
            </tr>
          ) : (
            requests.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelected(r)}
                style={{ cursor: "pointer" }}
              >
                <td className="dim mono">{formatDate(r.createdAt)}</td>
                <td>{r.name}</td>
                <td>{ORG_LABEL[r.orgType] ?? r.orgType}</td>
                <td>
                  <a href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()}>
                    {r.email}
                  </a>
                </td>
                <td className="mono">{r.phone}</td>
                <td className="right">
                  <span className={`pill ${STATUS_PILL[r.status] ?? ""}`}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            className="modal-shell"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560 }}
          >
            <div className="head">
              <h2>{selected.name}</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn btn-ghost"
                style={{ padding: "4px 10px" }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="body">
              <dl className="enquiry-detail">
                <div>
                  <dt>Organisation</dt>
                  <dd>{ORG_LABEL[selected.orgType] ?? selected.orgType}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                  </dd>
                </div>
                <div>
                  <dt>Received</dt>
                  <dd className="mono">{formatDate(selected.createdAt)}</dd>
                </div>
                {selected.contactedAt && (
                  <div>
                    <dt>First touch</dt>
                    <dd className="mono">{formatDate(selected.contactedAt)}</dd>
                  </div>
                )}
                <div>
                  <dt>Source</dt>
                  <dd className="mono">{selected.source}</dd>
                </div>
              </dl>

              <div>
                <label className="enquiry-label">Status</label>
                <div className="status-row">
                  {(["new", "contacted", "qualified", "won", "lost"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`tag-toggle${selected.status === s ? " on" : ""}`}
                      disabled={saving}
                      onClick={() => updateStatus(selected.id, s)}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="enquiry-label" htmlFor="enquiry-notes">
                  Notes
                </label>
                <textarea
                  id="enquiry-notes"
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Conversation log, demo time, next steps…"
                  rows={6}
                />
              </div>
            </div>
            <div className="foot">
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={() => deleteRequest(selected.id)}
              >
                DELETE
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || draftNotes === (selected.notes ?? "")}
                onClick={saveNotes}
              >
                {saving ? "SAVING…" : "SAVE NOTES"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .enquiry-detail {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 8px 16px;
          font-size: 13px;
          margin: 0;
        }
        .enquiry-detail dt {
          color: var(--ink-3);
          font-size: 11px;
          letter-spacing: 0.10em;
          text-transform: uppercase;
        }
        .enquiry-detail dd { color: var(--ink); margin: 0; }
        .enquiry-detail a { color: var(--teal); text-decoration: none; }
        .enquiry-detail a:hover { color: var(--vermilion); }
        .enquiry-label {
          display: block;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 8px;
        }
        .status-row { display: flex; flex-wrap: wrap; gap: 8px; }
      `}</style>
    </>
  );
}
