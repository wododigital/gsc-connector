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
  isActive: boolean;
}

interface ApiResponse {
  system: Prompt[];
  user: Prompt[];
  hasBrandProfile: boolean;
  hasReportRules: boolean;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "seo-report", label: "SEO REPORTS" },
  { id: "traffic-analysis", label: "TRAFFIC" },
  { id: "aeo", label: "AEO" },
  { id: "technical-seo", label: "TECHNICAL" },
  { id: "gbp-report", label: "GBP" },
  { id: "custom", label: "CUSTOM" },
];

const CONNECTIONS: { id: string; label: string }[] = [
  { id: "gsc", label: "GSC" },
  { id: "ga4", label: "GA4" },
  { id: "gbp", label: "GBP" },
];

/** Map category to a tag color class (used on the prompt card eyebrow). */
function tagToneFor(category: string): string {
  if (category.includes("traffic") || category === "ga4") return "amber";
  if (category.includes("aeo") || category === "gbp-report") return "magenta";
  if (category === "custom") return "green";
  return ""; // default vermilion
}

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

  // Counts per category, computed from the unfiltered list.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: all.length };
    for (const p of all) counts[p.category] = (counts[p.category] || 0) + 1;
    return counts;
  }, [all]);

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

  const toggleActive = async (p: Prompt) => {
    const res = await fetch(`/api/prompts/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) refresh();
  };

  const toggleConnection = (id: string) => {
    setActiveConnections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <>
      <style>{PROMPT_CSS}</style>
      <div>
        <CustomizeReportPanel />

        {/* Filter bar */}
        <div className="filter-bar">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="search"
          />
          {CATEGORIES.map((c) => {
            const count = categoryCounts[c.id] ?? 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={`filter${activeCategory === c.id ? " active" : ""}`}
              >
                {c.label} · {count}
              </button>
            );
          })}
          <span style={{ flex: 1 }} />
          {CONNECTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleConnection(c.id)}
              className={`filter${activeConnections.includes(c.id) ? " active" : ""}`}
              title={`Filter by ${c.label}`}
            >
              {c.label}
            </button>
          ))}
          {activeConnections.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveConnections([])}
              className="filter"
            >
              CLEAR
            </button>
          )}
        </div>

        {error && (
          <div className="prompt-error">{error}</div>
        )}

        {/* New prompt CTA */}
        <div className="new-prompt-bar">
          <span className="new-prompt-count">
            {filtered.length} OF {all.length} PROMPTS
          </span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setEditing("new")}
          >
            + NEW PROMPT
          </button>
        </div>

        {loading ? (
          <div className="prompt-loading">Loading prompts...</div>
        ) : filtered.length === 0 ? (
          <div className="prompt-empty">No prompts match the current filters.</div>
        ) : (
          <div className="prompt-grid">
            {filtered.map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                copied={copiedId === p.id}
                onCopy={() => copyPrompt(p)}
                onPreview={() => setPreviewing(p)}
                onEdit={p.isUserOwned ? () => setEditing(p) : undefined}
                onDelete={p.isUserOwned ? () => deletePrompt(p) : undefined}
                onToggleActive={p.isUserOwned ? () => toggleActive(p) : undefined}
              />
            ))}
          </div>
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
    </>
  );
}

function PromptCard({
  prompt: p,
  copied,
  onCopy,
  onPreview,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  prompt: Prompt;
  copied: boolean;
  onCopy: () => void;
  onPreview: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
}) {
  const tone = tagToneFor(p.category);
  const inactive = p.isUserOwned && !p.isActive;
  return (
    <div className={`prompt-card${inactive ? " inactive" : ""}`}>
      <div className="head">
        <div>
          <div className={`tag ${tone}`}>▸ {p.category.replace(/-/g, " ").toUpperCase()}</div>
          <div className="title">{p.title}</div>
        </div>
        {inactive ? (
          <span className="prompt-state-pill inactive" title="Hidden from AI assistants">INACTIVE</span>
        ) : p.isUserOwned ? (
          <span className="prompt-state-pill active" title="Available to AI assistants">ACTIVE</span>
        ) : (
          <span className="menu" title="Options">⋯</span>
        )}
      </div>
      <div className="body">{p.description}</div>
      <div className="meta">
        {p.requiredConnections.length > 0 && (
          <span>NEEDS {p.requiredConnections.map((c) => c.toUpperCase()).join(" + ")}</span>
        )}
        {p.questions.length > 0 && (
          <>
            <span>·</span>
            <span>{p.questions.length} QUESTION{p.questions.length === 1 ? "" : "S"}</span>
          </>
        )}
        {p.isUserOwned && (
          <>
            <span>·</span>
            <span>CUSTOM</span>
          </>
        )}
      </div>
      <div className="actions">
        <button type="button" className="primary" onClick={onCopy}>
          {copied ? "✓ COPIED" : "▸ COPY"}
        </button>
        <button type="button" onClick={onPreview}>PREVIEW</button>
        {onEdit && <button type="button" onClick={onEdit}>EDIT</button>}
        {onToggleActive && (
          <button type="button" onClick={onToggleActive}>
            {p.isActive ? "DEACTIVATE" : "ACTIVATE"}
          </button>
        )}
        {onDelete && <button type="button" onClick={onDelete}>DELETE</button>}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Customize Report panel                                                     */
/* Lets the user set logo, website, theme and accent color without leaving    */
/* the prompts page. Persists via /api/branding + /api/branding/logo.         */
/* ────────────────────────────────────────────────────────────────────────── */

interface ReportConfig {
  logoUrl: string | null;
  website: string;
  reportTheme: "light" | "dark";
  accentColor: string;
}

const DEFAULT_ACCENT = "#00B3B3";

function CustomizeReportPanel() {
  const [config, setConfig] = useState<ReportConfig>({
    logoUrl: null,
    website: "",
    reportTheme: "light",
    accentColor: DEFAULT_ACCENT,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/branding");
        if (!res.ok) return;
        const json = (await res.json()) as { profile: {
          logoUrl: string | null;
          website: string | null;
          reportTheme: string | null;
          accentColor: string | null;
        } | null };
        if (json.profile) {
          setConfig({
            logoUrl: json.profile.logoUrl,
            website: json.profile.website ?? "",
            reportTheme: json.profile.reportTheme === "dark" ? "dark" : "light",
            accentColor: json.profile.accentColor || DEFAULT_ACCENT,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const uploadLogo = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("logo", file);
      form.append("variant", "light");
      const res = await fetch("/api/branding/logo", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setConfig((c) => ({ ...c, logoUrl: data.url }));
      setLogoBroken(false);
    } catch {
      setError("Upload failed - try again");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: config.logoUrl,
          website: config.website || null,
          reportTheme: config.reportTheme,
          accentColor: config.accentColor,
          // Mirror the same accent for dark mode so single-color setup just works.
          accentColorDark: config.accentColor,
          // Auto-approve so reports immediately pick up these values.
          isApproved: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Save failed");
        return;
      }
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2400);
    } catch {
      setError("Save failed - try again");
    } finally {
      setSaving(false);
    }
  };

  const previewBg = config.reportTheme === "dark" ? "#0F172A" : "#FFFFFF";
  const previewText = config.reportTheme === "dark" ? "#F8FAFC" : "#1A1A2E";

  return (
    <section className="customize-report">
      <header className="customize-report-head">
        <div>
          <div className="eyebrow">CUSTOMIZE REPORTS</div>
          <p className="customize-report-sub">
            Set the logo, theme and accent that AI assistants apply to generated
            reports. Header, accent icons and footer use this accent.
          </p>
        </div>
        {savedAt && <span className="prompt-state-pill active">SAVED</span>}
      </header>

      <div className="customize-report-grid">
        <div className="customize-report-fields">
          <div className="customize-row">
            <label className="input-label">LOGO</label>
            <div className="customize-logo-row">
              <label className="customize-upload-btn">
                {uploading ? "UPLOADING..." : config.logoUrl ? "REPLACE LOGO" : "UPLOAD LOGO"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                  hidden
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadLogo(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {config.logoUrl && (
                <button
                  type="button"
                  className="customize-clear"
                  onClick={() => setConfig((c) => ({ ...c, logoUrl: null }))}
                >
                  REMOVE
                </button>
              )}
              <span className="customize-hint">PNG / JPG / SVG · 2MB max</span>
            </div>
          </div>

          <div className="customize-row">
            <label className="input-label">WEBSITE</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://yourbrand.com"
              value={config.website}
              onChange={(e) => setConfig((c) => ({ ...c, website: e.target.value }))}
              maxLength={300}
            />
          </div>

          <div className="customize-row-grid">
            <div>
              <label className="input-label">THEME</label>
              <div className="customize-theme-row">
                <button
                  type="button"
                  className={`customize-theme${config.reportTheme === "light" ? " active" : ""}`}
                  onClick={() => setConfig((c) => ({ ...c, reportTheme: "light" }))}
                >
                  ☀ LIGHT
                </button>
                <button
                  type="button"
                  className={`customize-theme${config.reportTheme === "dark" ? " active" : ""}`}
                  onClick={() => setConfig((c) => ({ ...c, reportTheme: "dark" }))}
                >
                  ☾ DARK
                </button>
              </div>
            </div>

            <div>
              <label className="input-label">ACCENT</label>
              <div className="customize-color-row">
                <input
                  type="color"
                  className="customize-color-input"
                  value={config.accentColor}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, accentColor: e.target.value.toUpperCase() }))
                  }
                />
                <input
                  type="text"
                  className="input-field"
                  value={config.accentColor}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, accentColor: e.target.value.toUpperCase() }))
                  }
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {error && <p className="prompt-error" style={{ marginBottom: 0 }}>{error}</p>}

          <div className="customize-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving || loading}
              onClick={save}
            >
              {saving ? "SAVING..." : "SAVE REPORT STYLE"}
            </button>
          </div>
        </div>

        <div className="customize-preview" style={{ background: previewBg, color: previewText }}>
          <div className="customize-preview-head" style={{ borderColor: config.accentColor }}>
            <div className="customize-preview-logo">
              {config.logoUrl && !logoBroken ? (
                <img
                  src={config.logoUrl}
                  alt="Logo preview"
                  onError={() => setLogoBroken(true)}
                  style={{ maxHeight: 38, maxWidth: 180, objectFit: "contain" }}
                />
              ) : (
                <span style={{ opacity: 0.55, fontSize: 10, letterSpacing: "0.16em" }}>
                  NO LOGO
                </span>
              )}
            </div>
            <span
              className="customize-preview-accent"
              style={{ background: config.accentColor }}
              aria-hidden
            />
          </div>
          <div className="customize-preview-body">
            <div className="customize-preview-title" style={{ color: config.accentColor }}>
              SAMPLE REPORT
            </div>
            <div className="customize-preview-line" />
            <div className="customize-preview-line short" />
            <div className="customize-preview-line" />
          </div>
          <div className="customize-preview-foot" style={{ borderColor: config.accentColor }}>
            <span style={{ color: config.accentColor, fontSize: 9, letterSpacing: "0.18em" }}>
              {config.website || "yourbrand.com"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewModal({ prompt: p, onClose }: { prompt: Prompt; onClose: () => void }) {
  return (
    <div
      className="prompt-modal-backdrop"
      onClick={onClose}
    >
      <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-modal-head">
          <h2>{p.title}</h2>
          <button type="button" onClick={onClose} className="btn">CLOSE</button>
        </div>
        <pre className="prompt-modal-body">{p.body}</pre>
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
    <div className="prompt-modal-backdrop" onClick={onClose}>
      <form
        onSubmit={save}
        className="prompt-modal prompt-modal-edit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="prompt-modal-head">
          <h2>{prompt ? "EDIT PROMPT" : "NEW PROMPT"}</h2>
          <button type="button" onClick={onClose} className="btn">CLOSE</button>
        </div>
        <div className="prompt-modal-fields">
          <div>
            <label className="input-label">TITLE</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="input-label">DESCRIPTION</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              required
              maxLength={500}
            />
          </div>
          <div className="prompt-modal-row">
            <div>
              <label className="input-label">CATEGORY</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
              >
                {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">REQUIRED CONNECTIONS</label>
              <div className="prompt-modal-pills">
                {CONNECTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleConnection(c.id)}
                    className={`filter${form.requiredConnections.includes(c.id) ? " active" : ""}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="prompt-modal-row-head">
              <label className="input-label">CLARIFYING QUESTIONS</label>
              <button type="button" onClick={addQuestion} className="prompt-modal-link">+ ADD</button>
            </div>
            <div className="prompt-modal-questions">
              {form.questions.map((q, i) => (
                <div key={i}>
                  <input
                    value={q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    className="input-field"
                    placeholder={`Question ${i + 1}`}
                  />
                  {form.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      className="btn btn-danger"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="input-label">PROMPT BODY (use {`{{brand.primaryColor}}`} for brand placeholders)</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="input-field prompt-modal-body-input"
              rows={12}
              required
              maxLength={20000}
            />
          </div>
          {error && <p className="prompt-error">{error}</p>}
        </div>
        <div className="prompt-modal-foot">
          <button type="button" onClick={onClose} className="btn">CANCEL</button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "SAVING..." : prompt ? "SAVE CHANGES" : "CREATE PROMPT"}
          </button>
        </div>
      </form>
    </div>
  );
}

const PROMPT_CSS = `
.prompt-notice {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  border-left: 3px solid var(--amber);
  padding: 14px 18px;
  margin-bottom: 16px;
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  flex-wrap: wrap;
}
.prompt-notice-title {
  font-size: 13px;
  color: var(--ink);
  font-weight: 500;
}
.prompt-notice-desc {
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 4px;
}

.filter-bar {
  display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
  padding: 14px 16px;
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  margin-bottom: 18px;
  font-size: 12px;
}
.filter-bar .filter {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  background: var(--surface-2);
  border: 1px solid var(--rule);
  color: var(--ink-2);
  font-size: 11px;
  letter-spacing: 0.04em;
  cursor: pointer;
  text-transform: uppercase;
  font-family: var(--body);
  transition: all .15s;
}
.filter-bar .filter:hover { border-color: var(--teal); color: var(--teal); }
.filter-bar .filter.active { background: var(--teal); color: var(--bg); border-color: var(--teal); font-weight: 500; }
.filter-bar .search {
  flex: 1; max-width: 280px;
  background: var(--bg);
  border: 1px solid var(--rule);
  color: var(--ink);
  padding: 7px 12px;
  font-family: var(--body);
  font-size: 12px;
  outline: none;
}
.filter-bar .search:focus { border-color: var(--teal); }

.new-prompt-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 18px;
}
.new-prompt-count {
  font-size: 11px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ink-3);
  font-family: var(--mono);
}
.prompt-loading, .prompt-empty {
  padding: 56px 24px;
  text-align: center;
  color: var(--ink-3);
  font-size: 13px;
  background: var(--surface-1);
  border: 1px dashed var(--rule-strong);
}
.prompt-error {
  padding: 12px 16px;
  background: var(--surface-1);
  border: 1px solid rgba(255,107,74,0.4);
  color: var(--vermilion);
  font-size: 12px;
  margin-bottom: 18px;
}

.prompt-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.prompt-card {
  padding: 22px;
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  display: flex; flex-direction: column; gap: 12px;
  transition: border-color .15s;
}
.prompt-card:hover { border-color: var(--teal); }
.prompt-card .head {
  display: flex; justify-content: space-between; align-items: start; gap: 12px;
}
.prompt-card .tag {
  font-size: 10px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--vermilion);
  margin-bottom: 6px;
}
.prompt-card .tag.green { color: var(--green); }
.prompt-card .tag.amber { color: var(--amber); }
.prompt-card .tag.magenta { color: var(--magenta); }
.prompt-card .title {
  font-family: var(--display);
  font-weight: 700; font-size: 17px;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  line-height: 1.15;
  color: var(--ink);
}
.prompt-card .menu {
  color: var(--ink-3); font-size: 18px;
  cursor: pointer; padding: 0 6px;
  transition: color .15s;
}
.prompt-card .menu:hover { color: var(--ink); }
.prompt-card .body {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--ink-2);
  background: var(--bg);
  border: 1px solid var(--rule);
  padding: 11px 12px;
  max-height: 90px;
  overflow: hidden;
  position: relative;
  line-height: 1.55;
}
.prompt-card .body::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 24px;
  background: linear-gradient(transparent, var(--bg));
  pointer-events: none;
}
.prompt-card .meta {
  display: flex; gap: 10px; flex-wrap: wrap;
  font-size: 10px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-3);
}
.prompt-card .actions {
  display: flex; gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--rule);
  flex-wrap: wrap;
}
.prompt-card .actions button {
  padding: 7px 12px;
  background: transparent;
  border: 1px solid var(--rule);
  color: var(--ink-2);
  font-family: var(--body);
  font-size: 10.5px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .15s;
}
.prompt-card .actions button:hover { border-color: var(--teal); color: var(--teal); }
.prompt-card .actions button.primary {
  background: var(--teal); color: var(--bg); border-color: var(--teal); font-weight: 600;
}
.prompt-card .actions button.primary:hover {
  background: var(--vermilion); border-color: var(--vermilion); color: var(--ink);
}

/* Modal */
.prompt-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.prompt-modal {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  max-width: 760px;
  width: 100%;
  max-height: 86vh;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.prompt-modal-edit { max-width: 720px; }
.prompt-modal-head {
  padding: 14px 18px;
  border-bottom: 1px solid var(--rule);
  background: var(--surface-2);
  display: flex; justify-content: space-between; align-items: center;
}
.prompt-modal-head h2 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--ink);
}
.prompt-modal-body {
  padding: 18px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--ink-2);
  white-space: pre-wrap;
  overflow: auto;
  flex: 1;
}
.prompt-modal-fields {
  padding: 18px;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px;
  flex: 1;
}
.prompt-modal-row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
}
.prompt-modal-row-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px;
}
.prompt-modal-link {
  background: none; border: none;
  color: var(--teal);
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  cursor: pointer;
}
.prompt-modal-link:hover { color: var(--vermilion); }
.prompt-modal-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.prompt-modal-pills .filter {
  padding: 6px 12px;
  background: var(--surface-2);
  border: 1px solid var(--rule);
  color: var(--ink-2);
  font-size: 11px;
  letter-spacing: 0.04em;
  cursor: pointer;
  text-transform: uppercase;
  font-family: var(--body);
}
.prompt-modal-pills .filter.active { background: var(--teal); color: var(--bg); border-color: var(--teal); }
.prompt-modal-questions {
  display: flex; flex-direction: column; gap: 8px;
}
.prompt-modal-questions > div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
.prompt-modal-body-input {
  font-family: var(--mono);
  font-size: 12px;
}
.prompt-modal-foot {
  padding: 14px 18px;
  border-top: 1px solid var(--rule);
  background: var(--surface-2);
  display: flex; justify-content: flex-end; gap: 10px;
}

/* Customize Report panel */
.customize-report {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 18px 20px;
  margin-bottom: 18px;
}
.customize-report-head {
  display: flex; justify-content: space-between; align-items: start; gap: 16px;
  margin-bottom: 16px;
}
.customize-report-head .eyebrow {
  font-family: var(--display);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--ink);
}
.customize-report-sub {
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 4px;
  max-width: 520px;
  line-height: 1.55;
}
.customize-report-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;
  align-items: start;
}
.customize-report-fields {
  display: flex; flex-direction: column; gap: 14px;
}
.customize-row { display: flex; flex-direction: column; gap: 6px; }
.customize-row-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
}
.customize-logo-row {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.customize-upload-btn {
  padding: 8px 14px;
  border: 1px dashed var(--rule-strong);
  background: var(--surface-2);
  color: var(--ink-2);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .15s;
}
.customize-upload-btn:hover { border-color: var(--teal); color: var(--teal); }
.customize-clear {
  padding: 8px 12px;
  background: transparent;
  border: 1px solid var(--rule);
  color: var(--ink-3);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}
.customize-clear:hover { border-color: var(--vermilion); color: var(--vermilion); }
.customize-hint {
  font-size: 10px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-3);
  font-family: var(--mono);
}
.customize-theme-row { display: flex; gap: 8px; }
.customize-theme {
  flex: 1;
  padding: 8px 12px;
  background: var(--surface-2);
  border: 1px solid var(--rule);
  color: var(--ink-2);
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .15s;
}
.customize-theme:hover { border-color: var(--teal); color: var(--teal); }
.customize-theme.active {
  background: var(--teal); color: var(--bg); border-color: var(--teal); font-weight: 600;
}
.customize-color-row {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 8px;
  align-items: center;
}
.customize-color-input {
  width: 44px; height: 36px;
  background: transparent;
  border: 1px solid var(--rule);
  padding: 2px;
  cursor: pointer;
}
.customize-actions { display: flex; gap: 10px; padding-top: 4px; }

.customize-preview {
  border: 1px solid var(--rule-strong);
  display: flex; flex-direction: column;
  min-height: 220px;
  overflow: hidden;
}
.customize-preview-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px;
  border-bottom: 2px solid var(--teal);
}
.customize-preview-logo {
  flex: 1;
  display: flex; align-items: center;
  min-height: 38px;
}
.customize-preview-accent {
  width: 22px; height: 22px;
}
.customize-preview-body {
  flex: 1;
  padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.customize-preview-title {
  font-family: var(--display);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.customize-preview-line {
  height: 6px;
  background: currentColor;
  opacity: 0.16;
  width: 100%;
}
.customize-preview-line.short { width: 60%; }
.customize-preview-foot {
  padding: 10px 16px;
  border-top: 2px solid var(--teal);
  text-align: right;
}

/* Inactive prompt card + state pill */
.prompt-card.inactive { opacity: 0.55; }
.prompt-card.inactive:hover { opacity: 0.85; }
.prompt-state-pill {
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 3px 8px;
  border: 1px solid var(--rule);
  color: var(--ink-3);
  white-space: nowrap;
  font-family: var(--mono);
}
.prompt-state-pill.active {
  color: var(--teal); border-color: var(--teal);
}
.prompt-state-pill.inactive {
  color: var(--ink-3); border-color: var(--rule);
  background: var(--surface-2);
}

@media (max-width: 980px) {
  .prompt-grid { grid-template-columns: 1fr; }
  .prompt-modal-row { grid-template-columns: 1fr; }
  .customize-report-grid { grid-template-columns: 1fr; }
  .customize-row-grid { grid-template-columns: 1fr; }
}
`;
