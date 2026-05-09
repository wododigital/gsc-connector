"use client";

import { useEffect, useRef, useState } from "react";
import { extractColors } from "@/lib/color-extractor";

interface BrandProfile {
  id: string;
  companyName: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  logoUrlDark: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  reportTheme: string | null;
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
const DEFAULT_LOGO_LIGHT_FALLBACK = "/OMG Rectangle LOGO Light BG.svg";
const DEFAULT_LOGO_DARK_FALLBACK = "/OMG Rectangle LOGO Dark BG.svg";

type Variant = "light" | "dark";
type Theme = "light" | "dark";

export function BrandingClient({ initial, embedded, onSaved }: Props) {
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [logoLight, setLogoLight] = useState<string | null>(initial?.logoUrl ?? null);
  const [logoDark, setLogoDark] = useState<string | null>(initial?.logoUrlDark ?? null);
  const [primary, setPrimary] = useState(initial?.primaryColor ?? DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(initial?.secondaryColor ?? DEFAULT_SECONDARY);
  const [accent, setAccent] = useState(initial?.accentColor ?? DEFAULT_ACCENT);
  const [font, setFont] = useState(initial?.fontFamily ?? "Inter");
  const [theme, setTheme] = useState<Theme>((initial?.reportTheme === "dark" ? "dark" : "light"));
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState<Variant | null>(null);
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(initial?.isApproved ?? false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const lightInputRef = useRef<HTMLInputElement>(null);
  const darkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initial) return;
    setApproved(initial.isApproved);
  }, [initial]);

  const onFileChosen = async (file: File, variant: Variant) => {
    setMessage(null);
    // Only auto-extract colors from the *light* logo (dark logos are usually
    // already adjusted for dark backgrounds and aren't a great colour source).
    if (variant === "light") {
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
    }

    setUploading(variant);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      fd.append("variant", variant);
      const res = await fetch("/api/branding/logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Logo upload failed" });
      } else if (variant === "dark") {
        setLogoDark(data.url);
      } else {
        setLogoLight(data.url);
      }
    } finally {
      setUploading(null);
    }
  };

  const onDrop = (variant: Variant) => (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onFileChosen(f, variant);
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
        logoUrl: logoLight,
        logoUrlDark: logoDark,
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
        fontFamily: font,
        reportTheme: theme,
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
    setMessage({
      kind: "ok",
      text: markApproved
        ? `Brand approved - reports will use your ${theme} theme.`
        : "Saved.",
    });
    if (onSaved) onSaved(data.profile);
  };

  const previewLogo = theme === "dark"
    ? (logoDark ?? logoLight ?? DEFAULT_LOGO_DARK_FALLBACK)
    : (logoLight ?? DEFAULT_LOGO_LIGHT_FALLBACK);

  const previewBg = theme === "dark" ? "#0F172A" : "#FFFFFF";
  const previewText = theme === "dark" ? "#F8FAFC" : "#1A1A2E";
  const previewMuted = theme === "dark" ? "#94A3B8" : "#6B7280";
  const previewCard = theme === "dark" ? "#1E293B" : "#F9FAFB";

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="page-title">Brand Profile</h1>
          <p className="page-subtitle">Customize report appearance with your brand.</p>
        </div>
      )}

      {/* Theme picker */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Report Theme</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Reports generated through the prompt library use this color scheme.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ThemeOption
            value="light"
            active={theme === "light"}
            onClick={() => setTheme("light")}
            label="Light"
            description="White background, dark text. Best for printable reports."
          />
          <ThemeOption
            value="dark"
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
            label="Dark"
            description="Dark background, light text. Modern, low-glare."
          />
        </div>
      </div>

      {/* Identity fields */}
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

      {/* Logos: light + dark */}
      <div className="glass-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Logos</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Upload one logo for each background. {theme === "dark" ? "We'll use the dark variant." : "We'll use the light variant."}
            {" "}A dark variant is optional - if missing, your light logo will be used on dark reports.
          </p>
        </div>

        <input
          ref={lightInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChosen(f, "light"); }}
        />
        <input
          ref={darkInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChosen(f, "dark"); }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <LogoSlot
            title="Light-background logo"
            hint="Used on light reports"
            value={logoLight}
            bg="#FFFFFF"
            textColor="#1a1a1a"
            onPick={() => lightInputRef.current?.click()}
            onDrop={onDrop("light")}
            uploading={uploading === "light"}
            highlighted={theme === "light"}
          />
          <LogoSlot
            title="Dark-background logo"
            hint="Used on dark reports (optional)"
            value={logoDark}
            bg="#0F172A"
            textColor="#F8FAFC"
            onPick={() => darkInputRef.current?.click()}
            onDrop={onDrop("dark")}
            uploading={uploading === "dark"}
            highlighted={theme === "dark"}
          />
        </div>

        {extracting && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Extracting colors from light logo...</p>}
      </div>

      {/* Brand colors */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Brand Colors</h2>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Auto-extracted from your light logo. Click a swatch to override.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <ColorSwatch label="Primary" value={primary} onChange={setPrimary} />
          <ColorSwatch label="Secondary" value={secondary} onChange={setSecondary} />
          <ColorSwatch label="Accent" value={accent} onChange={setAccent} />
        </div>
      </div>

      {/* Live theme preview */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Sample Report Header</h2>
          <span className="badge badge-muted" style={{ fontSize: "11px" }}>{theme === "dark" ? "Dark theme" : "Light theme"}</span>
        </div>
        <div
          className="rounded-lg p-5 transition-colors"
          style={{ background: previewBg, color: previewText, border: `1px solid ${previewCard}` }}
        >
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `2px solid ${primary}` }}>
            <img src={previewLogo} alt="logo preview" style={{ height: 30, maxWidth: 200, objectFit: "contain" }} />
            <div className="text-right" style={{ color: previewMuted, fontSize: 12 }}>
              <div style={{ color: previewText, fontWeight: 600, fontSize: 13 }}>Monthly SEO Performance</div>
              <div>April 1 - April 30, 2026</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded p-3" style={{ background: previewCard }}>
              <div style={{ fontSize: 10, color: previewMuted, textTransform: "uppercase", letterSpacing: ".05em" }}>Clicks</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: previewText, marginTop: 2 }}>42,113</div>
              <div style={{ fontSize: 12, color: primary }}>+18.4%</div>
            </div>
            <div className="rounded p-3" style={{ background: previewCard }}>
              <div style={{ fontSize: 10, color: previewMuted, textTransform: "uppercase", letterSpacing: ".05em" }}>Impressions</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: previewText, marginTop: 2 }}>1.24M</div>
              <div style={{ fontSize: 12, color: accent }}>+9.8%</div>
            </div>
            <div className="rounded p-3" style={{ background: previewCard }}>
              <div style={{ fontSize: 10, color: previewMuted, textTransform: "uppercase", letterSpacing: ".05em" }}>CTR</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: previewText, marginTop: 2 }}>3.4%</div>
              <div style={{ fontSize: 12, color: previewMuted }}>+0.3 pts</div>
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

function ThemeOption({
  value, active, onClick, label, description,
}: { value: Theme; active: boolean; onClick: () => void; label: string; description: string }) {
  const swatch = value === "dark" ? "#0F172A" : "#FFFFFF";
  const text = value === "dark" ? "#F8FAFC" : "#1A1A2E";
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-lg p-3 transition-all"
      style={{
        background: active ? "rgba(0,179,179,0.10)" : "rgba(6,10,16,0.4)",
        border: `1px solid ${active ? "var(--accent)" : "var(--glass-border)"}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-md flex items-center justify-center shrink-0" style={{ width: 44, height: 44, background: swatch, border: "1px solid var(--glass-border)" }}>
          <span style={{ color: text, fontSize: 11, fontWeight: 700 }}>Aa</span>
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{description}</div>
        </div>
        {active && <span className="ml-auto badge badge-success" style={{ fontSize: "10px" }}>Selected</span>}
      </div>
    </button>
  );
}

function LogoSlot({
  title, hint, value, bg, textColor, onPick, onDrop, uploading, highlighted,
}: {
  title: string;
  hint: string;
  value: string | null;
  bg: string;
  textColor: string;
  onPick: () => void;
  onDrop: (e: React.DragEvent) => void;
  uploading: boolean;
  highlighted: boolean;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: "rgba(6,10,16,0.4)",
        border: `1px solid ${highlighted ? "var(--accent)" : "var(--glass-border)"}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{hint}</p>
        </div>
        {highlighted && <span className="badge badge-accent" style={{ fontSize: "10px" }}>Active</span>}
      </div>
      <div
        onClick={onPick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="cursor-pointer rounded-md flex items-center justify-center"
        style={{ background: bg, color: textColor, minHeight: 96, border: `1px dashed ${textColor === "#F8FAFC" ? "rgba(248,250,252,0.25)" : "rgba(0,0,0,0.15)"}` }}
      >
        {value ? (
          <img src={value} alt={title} style={{ maxHeight: 64, maxWidth: "85%", objectFit: "contain" }} />
        ) : (
          <span className="text-xs" style={{ opacity: 0.7 }}>
            {uploading ? "Uploading..." : "Click or drop to upload"}
          </span>
        )}
      </div>
      <div className="flex justify-end mt-2">
        <button onClick={onPick} className="text-xs" style={{ color: "var(--accent-light)" }}>
          {value ? "Replace" : "Upload"}
        </button>
      </div>
    </div>
  );
}
