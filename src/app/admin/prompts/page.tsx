"use client";

import { useEffect, useState } from "react";

interface Prompt {
  id: string;
  title: string;
  description: string;
  body: string;
  category: string;
  requiredConnections: string[];
  questions: string[];
  semanticTags: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: "seo-report", label: "SEO Report" },
  { id: "traffic-analysis", label: "Traffic Analysis" },
  { id: "aeo", label: "AEO" },
  { id: "technical-seo", label: "Technical SEO" },
  { id: "gbp-report", label: "GBP" },
  { id: "competitor", label: "Competitor" },
  { id: "custom", label: "Custom" },
];

const CONNECTIONS = [
  { id: "gsc", label: "GSC" },
  { id: "ga4", label: "GA4" },
  { id: "gbp", label: "GBP" },
];

const EMPTY: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "semanticTags"> = {
  title: "",
  description: "",
  body: "",
  category: "seo-report",
  requiredConnections: [],
  questions: [""],
  sortOrder: 100,
  isActive: true,
};

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Prompt | "new" | null>(null);
  const [retagging, setRetagging] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/prompts");
    const data = await res.json();
    setPrompts(data.prompts ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggleActive = async (p: Prompt) => {
    await fetch(`/api/admin/prompts/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: p.title,
        description: p.description,
        body: p.body,
        category: p.category,
        requiredConnections: p.requiredConnections,
        questions: p.questions,
        sortOrder: p.sortOrder,
        isActive: !p.isActive,
        semanticTags: p.semanticTags,
      }),
    });
    refresh();
  };

  const retag = async (p: Prompt) => {
    setRetagging(p.id);
    await fetch(`/api/admin/prompts/${p.id}/retag`, { method: "POST" });
    setRetagging(null);
    refresh();
  };

  const deletePrompt = async (p: Prompt) => {
    if (!confirm(`Deactivate "${p.title}"? It will be hidden from users but kept in the database.`))
      return;
    await fetch(`/api/admin/prompts/${p.id}`, { method: "DELETE" });
    refresh();
  };

  const activeCount = prompts.filter((p) => p.isActive).length;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <span className="num">07</span>
            <span>·</span>
            <span>ADMIN · PROMPT LIBRARY</span>
          </div>
          <h1>
            System <span className="accent">prompts.</span>
          </h1>
          <p className="lede">
            Templates available to every workspace. Use brand placeholders so each user gets a
            personalized copy on paste.
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
            + New Prompt
          </button>
        </div>
      </div>

      <div className="logs-meta">
        <span>
          TOTAL <strong>{prompts.length}</strong>
        </span>
        <span>·</span>
        <span>
          ACTIVE <strong>{activeCount}</strong>
        </span>
        <span>·</span>
        <span>
          INACTIVE <strong>{prompts.length - activeCount}</strong>
        </span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>TITLE</th>
            <th>CATEGORY</th>
            <th>CONNECTIONS</th>
            <th className="right">SORT</th>
            <th>TAGS</th>
            <th>STATUS</th>
            <th className="right">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="row-empty">
              <td colSpan={7}>Loading prompt library...</td>
            </tr>
          ) : prompts.length === 0 ? (
            <tr className="row-empty">
              <td colSpan={7}>No prompts yet. Create the first one above.</td>
            </tr>
          ) : (
            prompts.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ color: "var(--ink)", fontWeight: 500 }}>{p.title}</div>
                  <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>
                    {p.description}
                  </div>
                </td>
                <td>
                  <span className="pill info">{p.category}</span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.requiredConnections.length === 0 ? (
                      <span className="dim mono" style={{ fontSize: 11 }}>
                        none
                      </span>
                    ) : (
                      p.requiredConnections.map((c) => (
                        <span key={c} className="pill success">
                          {c.toUpperCase()}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="right mono">{p.sortOrder}</td>
                <td
                  className="dim mono"
                  style={{ maxWidth: 200, fontSize: 11 }}
                  title={(p.semanticTags ?? []).join(", ")}
                >
                  {(p.semanticTags ?? []).slice(0, 4).join(", ")}
                  {(p.semanticTags ?? []).length > 4 && "..."}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    className={`pill ${p.isActive ? "success" : "warn"}`}
                    style={{ cursor: "pointer", background: "transparent" }}
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="right">
                  <div style={{ display: "inline-flex", gap: 14, fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase" }}>
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--teal)",
                        cursor: "pointer",
                        font: "inherit",
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => retag(p)}
                      disabled={retagging === p.id}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--ink-2)",
                        cursor: "pointer",
                        font: "inherit",
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        opacity: retagging === p.id ? 0.5 : 1,
                      }}
                    >
                      {retagging === p.id ? "..." : "Retag"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePrompt(p)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--vermilion)",
                        cursor: "pointer",
                        font: "inherit",
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                      }}
                    >
                      Deactivate
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {editing !== null && (
        <PromptModal
          prompt={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </>
  );
}

function PromptModal({
  prompt,
  onClose,
  onSaved,
}: {
  prompt: Prompt | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = prompt ?? EMPTY;
  const [form, setForm] = useState({
    title: initial.title,
    description: initial.description,
    body: initial.body,
    category: initial.category,
    requiredConnections: initial.requiredConnections,
    questions: initial.questions.length ? initial.questions : [""],
    sortOrder: initial.sortOrder,
    isActive: initial.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      questions: form.questions.map((q) => q.trim()).filter(Boolean),
    };
    const res = await fetch(prompt ? `/api/admin/prompts/${prompt.id}` : "/api/admin/prompts", {
      method: prompt ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      setSaving(false);
      return;
    }
    onSaved();
  };

  const updateQuestion = (i: number, v: string) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q, idx) => (idx === i ? v : q)) }));
  const addQuestion = () => setForm((f) => ({ ...f, questions: [...f.questions, ""] }));
  const removeQuestion = (i: number) =>
    setForm((f) => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
  const toggleConnection = (id: string) =>
    setForm((f) => ({
      ...f,
      requiredConnections: f.requiredConnections.includes(id)
        ? f.requiredConnections.filter((c) => c !== id)
        : [...f.requiredConnections, id],
    }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-shell" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="head">
          <h2>{prompt ? "Edit System Prompt" : "New System Prompt"}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-3)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="input-label">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field"
                required
                maxLength={200}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="input-label">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                required
                maxLength={500}
              />
            </div>
            <div>
              <label className="input-label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
                style={{ cursor: "pointer" }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Required Connections</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CONNECTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleConnection(c.id)}
                  className={`tag-toggle ${form.requiredConnections.includes(c.id) ? "on" : ""}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label className="input-label" style={{ marginBottom: 0 }}>
                Clarifying Questions
              </label>
              <button
                type="button"
                onClick={addQuestion}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--teal)",
                  cursor: "pointer",
                  fontSize: 11,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  font: "inherit",
                }}
              >
                + Add
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {form.questions.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <input
                    value={q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    className="input-field"
                    placeholder={`Question ${i + 1}`}
                    style={{ flex: 1 }}
                  />
                  {form.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      className="btn btn-danger"
                      style={{ padding: "8px 14px" }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Prompt Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={14}
              required
              maxLength={20000}
            />
            <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
              Use {"{{brand.companyName}}"}, {"{{brand.logoUrl}}"}, {"{{brand.primaryColor}}"}, etc.
              for brand placeholders. They are populated when copied.
            </p>
          </div>

          {error && (
            <p style={{ color: "var(--vermilion)", fontSize: 12, margin: 0 }}>{error}</p>
          )}
        </div>

        <div className="foot">
          <button type="button" onClick={onClose} className="btn">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving..." : prompt ? "Save Changes" : "Create Prompt"}
          </button>
        </div>
      </form>
    </div>
  );
}
