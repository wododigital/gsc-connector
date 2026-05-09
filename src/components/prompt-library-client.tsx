"use client";

import { useEffect, useMemo, useState } from "react";

interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredConnections: string[];
  questions: string[];
  semanticTags: string[];
  body: string;       // brand-injected, ready for clipboard
  rawBody: string;    // raw template (used for editing)
  isUserOwned: boolean;
}

interface ApiResponse {
  system: Prompt[];
  user: Prompt[];
  hasBrandProfile: boolean;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "seo-report", label: "SEO Reports" },
  { id: "traffic-analysis", label: "Traffic" },
  { id: "aeo", label: "AEO" },
  { id: "technical-seo", label: "Technical" },
  { id: "gbp-report", label: "GBP" },
  { id: "custom", label: "Custom" },
];

const CONNECTIONS: { id: string; label: string }[] = [
  { id: "gsc", label: "GSC" },
  { id: "ga4", label: "GA4" },
  { id: "gbp", label: "GBP" },
];

export function PromptLibraryClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeConnections, setActiveConnections] = useState<string[]>([]);
  const [editing, setEditing] = useState<Prompt | "new" | null>(null);
  const [previewing, setPreviewing] = useState<Prompt | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prompts");
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const all = useMemo(() => {
    if (!data) return [] as Prompt[];
    return [...data.system, ...data.user];
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (activeConnections.length > 0) {
        const has = activeConnections.every((c) => p.requiredConnections.includes(c));
        if (!has) return false;
      }
      if (q) {
        const haystack = [p.title, p.description, p.category, ...p.semanticTags].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [all, search, activeCategory, activeConnections]);

  const systemFiltered = filtered.filter((p) => !p.isUserOwned);
  const userFiltered = filtered.filter((p) => p.isUserOwned);

  const copyPrompt = async (p: Prompt) => {
    try {
      await navigator.clipboard.writeText(p.body);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId((id) => (id === p.id ? null : id)), 2000);
    } catch {
      setError("Clipboard failed - please copy manually from preview");
    }
  };

  const deletePrompt = async (p: Prompt) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const res = await fetch(`/api/prompts/${p.id}`, { method: "DELETE" });
    if (res.ok) refresh();
  };

  const toggleConnection = (id: string) => {
    setActiveConnections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Prompt Library</h1>
          <p className="page-subtitle">Discover and use prompt templates for reports.</p>
        </div>
        <button className="btn-primary btn-primary-sm" onClick={() => setEditing("new")}>+ New Prompt</button>
      </div>

      {data && !data.hasBrandProfile && (
        <div className="glass-card p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Reports will use OMG Bridge default branding
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Set up your brand profile to white-label generated reports with your logo and colors.
            </p>
          </div>
          <a href="/dashboard/branding" className="btn-ghost btn-ghost-sm">Set up branding</a>
        </div>
      )}

      {/* Search + filter row */}
      <div className="glass-card p-4 space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search prompts..."
          className="glass-input text-sm w-full"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`badge ${activeCategory === c.id ? "badge-accent" : "badge-muted"} cursor-pointer`}
              style={{ padding: "4px 10px", fontSize: "12px" }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center pt-2" style={{ borderTop: "1px solid var(--glass-border)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Requires:</span>
          {CONNECTIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleConnection(c.id)}
              className={`badge ${activeConnections.includes(c.id) ? "badge-success" : "badge-muted"} cursor-pointer`}
              style={{ padding: "4px 10px", fontSize: "12px" }}
            >
              {c.label}
            </button>
          ))}
          {activeConnections.length > 0 && (
            <button
              onClick={() => setActiveConnections([])}
              className="text-xs"
              style={{ color: "var(--text-muted)", textDecoration: "underline" }}
            >
              clear
            </button>
          )}
        </div>
      </div>

      {error && <div className="glass-card p-3 text-sm" style={{ color: "var(--error)" }}>{error}</div>}

      {loading ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Loading prompts...</div>
      ) : (
        <>
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Templates ({systemFiltered.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {systemFiltered.map((p) => (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  copied={copiedId === p.id}
                  onCopy={() => copyPrompt(p)}
                  onPreview={() => setPreviewing(p)}
                />
              ))}
              {systemFiltered.length === 0 && (
                <div className="col-span-full text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>
                  No templates match the current filters.
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-3 mt-8" style={{ color: "var(--text-primary)" }}>
              Your Custom Prompts ({userFiltered.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {userFiltered.map((p) => (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  copied={copiedId === p.id}
                  onCopy={() => copyPrompt(p)}
                  onPreview={() => setPreviewing(p)}
                  onEdit={() => setEditing(p)}
                  onDelete={() => deletePrompt(p)}
                />
              ))}
              {userFiltered.length === 0 && (
                <div className="col-span-full text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>
                  You haven&apos;t created any custom prompts yet.
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {editing !== null && (
        <PromptModal
          prompt={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}

      {previewing && (
        <PreviewModal prompt={previewing} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
}

function PromptCard({
  prompt: p,
  copied,
  onCopy,
  onPreview,
  onEdit,
  onDelete,
}: {
  prompt: Prompt;
  copied: boolean;
  onCopy: () => void;
  onPreview: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="glass-card p-4 flex flex-col gap-3 h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.title}</h3>
          <span className="badge badge-muted mt-1 inline-block" style={{ fontSize: "10px" }}>
            {p.category}
          </span>
        </div>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {p.description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {p.requiredConnections.map((c) => (
          <span key={c} className={`badge ${connectionBadgeClass(c)}`} style={{ fontSize: "10px" }}>
            {c.toUpperCase()}
          </span>
        ))}
      </div>
      <div className="flex gap-2 mt-auto pt-2" style={{ borderTop: "1px solid var(--glass-border)" }}>
        <button onClick={onCopy} className="btn-primary btn-primary-sm flex-1">
          {copied ? "Copied!" : "Copy Prompt"}
        </button>
        <button onClick={onPreview} className="btn-ghost btn-ghost-sm">Preview</button>
        {onEdit && <button onClick={onEdit} className="btn-ghost btn-ghost-sm">Edit</button>}
        {onDelete && (
          <button
            onClick={onDelete}
            className="btn-ghost btn-ghost-sm"
            style={{ color: "var(--error)" }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function connectionBadgeClass(c: string): string {
  if (c === "gsc") return "badge-accent";
  if (c === "ga4") return "badge-info";
  if (c === "gbp") return "badge-warning";
  return "badge-muted";
}

function PreviewModal({ prompt: p, onClose }: { prompt: Prompt; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="glass-panel max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--glass-border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.title}</h2>
          <button onClick={onClose} className="text-sm" style={{ color: "var(--text-muted)" }}>Close</button>
        </div>
        <pre
          className="text-xs font-mono p-4 overflow-auto whitespace-pre-wrap"
          style={{ color: "var(--text-secondary)", flex: 1 }}
        >
          {p.body}
        </pre>
      </div>
    </div>
  );
}

interface ModalState {
  title: string;
  description: string;
  category: string;
  body: string;
  questions: string[];
  requiredConnections: string[];
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
  const [form, setForm] = useState<ModalState>({
    title: prompt?.title ?? "",
    description: prompt?.description ?? "",
    category: prompt?.category ?? "custom",
    body: prompt?.rawBody ?? "",
    questions: prompt?.questions ?? [""],
    requiredConnections: prompt?.requiredConnections ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      body: form.body,
      questions: form.questions.map((q) => q.trim()).filter(Boolean),
      requiredConnections: form.requiredConnections,
    };
    const res = await fetch(prompt ? `/api/prompts/${prompt.id}` : "/api/prompts", {
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

  const updateQuestion = (i: number, value: string) => {
    setForm((f) => ({ ...f, questions: f.questions.map((q, idx) => (idx === i ? value : q)) }));
  };
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
      <form
        onSubmit={save}
        className="glass-panel max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--glass-border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {prompt ? "Edit Prompt" : "New Prompt"}
          </h2>
          <button type="button" onClick={onClose} className="text-sm" style={{ color: "var(--text-muted)" }}>Close</button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto" style={{ flex: 1 }}>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="glass-input text-sm w-full" required maxLength={200} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass-input text-sm w-full" required maxLength={500} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="glass-select text-sm w-full">
              {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
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
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Prompt Body (use {`{{brand.primaryColor}}`} etc. for brand placeholders)</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="glass-input text-xs font-mono w-full"
              rows={12}
              required
              maxLength={20000}
            />
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
