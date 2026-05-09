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

  useEffect(() => { refresh(); }, []);

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
    if (!confirm(`Deactivate "${p.title}"? It will be hidden from users but kept in the database.`)) return;
    await fetch(`/api/admin/prompts/${p.id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Prompts</h1>
          <p className="page-subtitle">System-wide prompt templates available to every user.</p>
        </div>
        <button className="btn-primary btn-primary-sm" onClick={() => setEditing("new")}>+ New Prompt</button>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Connections</th>
              <th>Sort</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading...</td></tr>
            ) : prompts.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{p.title}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{p.description}</div>
                </td>
                <td><span className="badge badge-muted" style={{ fontSize: "11px" }}>{p.category}</span></td>
                <td>
                  <div className="flex gap-1">
                    {p.requiredConnections.map((c) => (
                      <span key={c} className="badge badge-accent" style={{ fontSize: "10px" }}>{c.toUpperCase()}</span>
                    ))}
                  </div>
                </td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{p.sortOrder}</td>
                <td className="text-xs" style={{ color: "var(--text-muted)", maxWidth: 180 }}>
                  {(p.semanticTags ?? []).slice(0, 5).join(", ")}
                  {(p.semanticTags ?? []).length > 5 && "..."}
                </td>
                <td>
                  <button
                    onClick={() => toggleActive(p)}
                    className={`badge ${p.isActive ? "badge-success" : "badge-muted"} cursor-pointer`}
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(p)} className="text-xs" style={{ color: "var(--accent-light)" }}>Edit</button>
                    <button onClick={() => retag(p)} disabled={retagging === p.id} className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {retagging === p.id ? "..." : "Retag"}
                    </button>
                    <button onClick={() => deletePrompt(p)} className="text-xs" style={{ color: "var(--error)" }}>Deactivate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <PromptModal
          prompt={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <form onSubmit={save} className="glass-panel max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--glass-border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {prompt ? "Edit System Prompt" : "New System Prompt"}
          </h2>
          <button type="button" onClick={onClose} className="text-sm" style={{ color: "var(--text-muted)" }}>Close</button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto" style={{ flex: 1 }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="glass-input text-sm w-full" required maxLength={200} />
            </div>
            <div className="col-span-2">
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass-input text-sm w-full" required maxLength={500} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="glass-select text-sm w-full">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="glass-input text-sm w-full" />
            </div>
          </div>

          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Required Connections</label>
            <div className="flex flex-wrap gap-2">
              {CONNECTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleConnection(c.id)}
                  className={`badge ${form.requiredConnections.includes(c.id) ? "badge-success" : "badge-muted"} cursor-pointer`}
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs" style={{ color: "var(--text-muted)" }}>Clarifying Questions</label>
              <button type="button" onClick={addQuestion} className="text-xs" style={{ color: "var(--accent-light)" }}>+ Add</button>
            </div>
            <div className="space-y-2">
              {form.questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input value={q} onChange={(e) => updateQuestion(i, e.target.value)} className="glass-input text-sm flex-1" placeholder={`Question ${i + 1}`} />
                  {form.questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(i)} className="btn-ghost btn-ghost-sm" style={{ color: "var(--error)" }}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Prompt Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="glass-input text-xs font-mono w-full"
              rows={14}
              required
              maxLength={20000}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Use {"{{brand.companyName}}"}, {"{{brand.logoUrl}}"}, {"{{brand.primaryColor}}"}, etc. for brand placeholders. They are populated when copied.
            </p>
          </div>

          {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}
        </div>
        <div className="p-4 flex justify-end gap-2" style={{ borderTop: "1px solid var(--glass-border)" }}>
          <button type="button" onClick={onClose} className="btn-ghost btn-ghost-sm">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary btn-primary-sm">
            {saving ? "Saving..." : prompt ? "Save Changes" : "Create Prompt"}
          </button>
        </div>
      </form>
    </div>
  );
}
