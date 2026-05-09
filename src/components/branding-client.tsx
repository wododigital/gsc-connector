"use client";

import { useEffect, useRef, useState } from "react";
import { extractColors } from "@/lib/color-extractor";

interface BrandProfile {
  id: string;
  companyName: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  isApproved: boolean;
}

interface Props {
  initial: BrandProfile | null;
  /** When true, hides the page heading - used inside the onboarding wizard. */
  embedded?: boolean;
  /** Called after a successful save with the latest profile. */
  onSaved?: (profile: BrandProfile) => void;
}

const DEFAULT_PRIMARY = "#00B3B3";
const DEFAULT_SECONDARY = "#0E1420";
const DEFAULT_ACCENT = "#6366F1";

export function BrandingClient({ initial, embedded, onSaved }: Props) {
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initial?.logoUrl ?? null);
  const [primary, setPrimary] = useState(initial?.primaryColor ?? DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(initial?.secondaryColor ?? DEFAULT_SECONDARY);
  const [accent, setAccent] = useState(initial?.accentColor ?? DEFAULT_ACCENT);
  const [font, setFont] = useState(initial?.fontFamily ?? "Inter");
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(initial?.isApproved ?? false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initial) return;
    setApproved(initial.isApproved);
  }, [initial]);

  const onFileChosen = async (file: File) => {
    setMessage(null);
    setExtracting(true);
    try {
      const colors = await extractColors(file);
      setPrimary(colors.primary);
      setSecondary(colors.secondary);
      setAccent(colors.accent);
    } catch (err) {
      console.warn("color extract failed", err);
    } finally {
      setExtracting(false);
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/branding/logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Logo upload failed" });
      } else {
        setLogoUrl(data.url);
      }
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onFileChosen(f);
  };

  const save = async (markApproved: boolean) => {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/branding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        website,
        description,
        logoUrl,
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
        fontFamily: font,
        isApproved: markApproved,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ kind: "err", text: data.error ?? "Save failed" });
      return;
    }
    setApproved(markApproved);
    setMessage({ kind: "ok", text: markApproved ? "Brand profile approved." : "Saved." });
    if (onSaved) onSaved(data.profile);
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="page-title">Brand Profile</h1>
          <p className="page-subtitle">Customize report appearance with your brand.</p>
        </div>
      )}

      <div className="glass-card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Company / Agency Name</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="glass-input text-sm w-full" placeholder="Acme Marketing" maxLength={200} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className="glass-input text-sm w-full" placeholder="acme.com" maxLength={300} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>About (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="glass-input text-sm w-full" placeholder="One or two sentences that describe your agency. Shown in some reports." maxLength={2000} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Font Family</label>
            <select value={font} onChange={(e) => setFont(e.target.value)} className="glass-select text-sm w-full">
              {FONT_CHOICES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Logo</h2>
          {logoUrl && <button onClick={() => inputRef.current?.click()} className="text-xs" style={{ color: "var(--accent-light)" }}>Replace</button>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileChosen(f);
          }}
        />
        {logoUrl ? (
          <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid var(--glass-border)" }}>
            <img src={logoUrl} alt="Your logo" style={{ height: 56, maxWidth: 220, objectFit: "contain" }} />
            <p className="text-xs" style={{ color: "#1a1a1a" }}>Logo preview on a light background (matches report header).</p>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="cursor-pointer rounded-lg flex flex-col items-center justify-center text-center gap-1"
            style={{ minHeight: 160, border: "2px dashed var(--glass-border)", background: "rgba(6,10,16,0.4)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Drag &amp; drop or click to upload your logo</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>PNG, JPG, SVG, WEBP - max 2MB</p>
          </div>
        )}
        {uploading && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Uploading...</p>}
        {extracting && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Extracting colors...</p>}
      </div>

      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Brand Colors</h2>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Extracted from your logo. Click a swatch to override.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <ColorSwatch label="Primary" value={primary} onChange={setPrimary} />
          <ColorSwatch label="Secondary" value={secondary} onChange={setSecondary} />
          <ColorSwatch label="Accent" value={accent} onChange={setAccent} />
        </div>

        <div className="rounded-lg p-4" style={{ background: secondary, color: "#fff" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Sample report header</span>
            <span className="text-xs" style={{ color: primary }}>Live preview</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="text-xs opacity-70">Clicks</div>
              <div className="text-2xl font-bold" style={{ color: primary }}>12,431</div>
            </div>
            <div className="rounded p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="text-xs opacity-70">Impressions</div>
              <div className="text-2xl font-bold" style={{ color: accent }}>248,310</div>
            </div>
            <div className="rounded p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="text-xs opacity-70">CTR</div>
              <div className="text-2xl font-bold">5.0%</div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="glass-card p-3 text-sm" style={{ color: message.kind === "ok" ? "var(--success)" : "var(--error)" }}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={() => save(true)} disabled={saving} className="btn-primary btn-primary-sm">
          {saving ? "Saving..." : approved ? "Save Changes" : "Approve & Save"}
        </button>
        <button onClick={() => save(false)} disabled={saving} className="btn-ghost btn-ghost-sm">Save Draft</button>
        {approved && (
          <span className="badge badge-success" style={{ fontSize: "11px" }}>Approved - reports use your brand</span>
        )}
      </div>
    </div>
  );
}

const FONT_CHOICES = ["Inter", "Roboto", "Open Sans", "Lato", "Poppins", "Montserrat", "Source Sans Pro", "Nunito", "Merriweather", "Playfair Display"];

function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="rounded-lg p-3 cursor-pointer block" style={{ background: "rgba(6,10,16,0.4)", border: "1px solid var(--glass-border)" }}>
      <div className="rounded mb-2" style={{ background: value, height: 56 }} />
      <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} style={{ width: 26, height: 26, border: "none", background: "transparent" }} />
        <input value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="glass-input text-xs font-mono" style={{ width: 90 }} maxLength={7} />
      </div>
    </label>
  );
}
