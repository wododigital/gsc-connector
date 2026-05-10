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
  accentColorDark: string | null;
  fontFamily: string | null;
  reportTheme: string | null;
  reportDos: string | null;
  reportDonts: string | null;
  isApproved: boolean;
}

interface Props {
  initial: BrandProfile | null;
  /** When true, hides any extra page heading - used inside the onboarding wizard. */
  embedded?: boolean;
  /** Called after a successful save with the latest profile. */
  onSaved?: (profile: BrandProfile) => void;
}

const DEFAULT_LOGO_LIGHT_FALLBACK = "/omg-logo-light.webp";
const DEFAULT_LOGO_DARK_FALLBACK = "/omg-logo-light.webp";
const DEFAULT_ACCENT = "#00B5B5"; // OMG teal - the brand highlight

const THEME_DEFAULTS: Record<"light" | "dark", { primary: string; secondary: string }> = {
  light: { primary: "#0E1420", secondary: "#374151" },
  dark:  { primary: "#F8FAFC", secondary: "#CBD5E1" },
};

type Variant = "light" | "dark";
type Theme = "light" | "dark";

function isThemeDefaultColor(color: string): boolean {
  const c = color.toUpperCase();
  return Object.values(THEME_DEFAULTS).some(
    (d) => d.primary.toUpperCase() === c || d.secondary.toUpperCase() === c
  );
}

const FONT_CHOICES = ["Inter", "Roboto", "Open Sans", "Lato", "Poppins", "Montserrat", "Source Sans Pro", "Nunito", "Merriweather", "Playfair Display"];

function countLines(s: string): number {
  return s.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0).length;
}

export function BrandingClient({ initial, embedded, onSaved }: Props) {
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [logoLight, setLogoLight] = useState<string | null>(initial?.logoUrl ?? null);
  const [logoDark, setLogoDark] = useState<string | null>(initial?.logoUrlDark ?? null);
  const initialTheme: Theme = initial?.reportTheme === "dark" ? "dark" : "light";
  const themeDefault = THEME_DEFAULTS[initialTheme];
  const [primary, setPrimary] = useState(initial?.primaryColor ?? themeDefault.primary);
  const [secondary, setSecondary] = useState(initial?.secondaryColor ?? themeDefault.secondary);
  const [accent, setAccent] = useState(initial?.accentColor ?? DEFAULT_ACCENT);
  const [accentDark, setAccentDark] = useState(initial?.accentColorDark ?? initial?.accentColor ?? DEFAULT_ACCENT);
  const [font, setFont] = useState(initial?.fontFamily ?? "Inter");
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [reportDos, setReportDos] = useState(initial?.reportDos ?? "");
  const [reportDonts, setReportDonts] = useState(initial?.reportDonts ?? "");

  const switchTheme = (next: Theme) => {
    if (next === theme) return;
    setTheme(next);
    if (isThemeDefaultColor(primary)) setPrimary(THEME_DEFAULTS[next].primary);
    if (isThemeDefaultColor(secondary)) setSecondary(THEME_DEFAULTS[next].secondary);
  };

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
    setExtracting(true);
    try {
      const colors = await extractColors(file);
      if (variant === "light") {
        setPrimary(colors.primary);
        setSecondary(colors.secondary);
        setAccent(colors.accent);
        if (!logoDark) setAccentDark(colors.accent);
      } else {
        setAccentDark(colors.accent);
      }
    } catch (err) {
      console.warn("color extract failed", err);
    } finally {
      setExtracting(false);
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
        accentColorDark: accentDark,
        fontFamily: font,
        reportTheme: theme,
        reportDos,
        reportDonts,
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
  const activeAccent = theme === "dark" ? accentDark : accent;

  return (
    <>
      <style>{BRANDING_CSS}</style>
      <div className="branding-stack">
        {/* Theme picker */}
        <section className="branding-section">
          <div className="branding-section-head">
            <div>
              <h2>REPORT THEME</h2>
              <p>Reports generated through the prompt library use this color scheme.</p>
            </div>
          </div>
          <div className="theme-grid">
            <ThemeOption
              active={theme === "light"}
              onClick={() => switchTheme("light")}
              label="LIGHT"
              description="White background, dark text. Best for printable reports."
              swatch="#FFFFFF"
              text="#1A1A2E"
            />
            <ThemeOption
              active={theme === "dark"}
              onClick={() => switchTheme("dark")}
              label="DARK"
              description="Dark background, light text. Modern, low-glare."
              swatch="#0F172A"
              text="#F8FAFC"
            />
          </div>
        </section>

        {/* Identity */}
        <section className="branding-section">
          <div className="branding-section-head">
            <div>
              <h2>IDENTITY</h2>
              <p>How your agency shows up in every generated report.</p>
            </div>
          </div>
          <div className="branding-fields">
            <div>
              <label className="input-label">COMPANY / AGENCY NAME</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-field"
                placeholder="Acme Marketing"
                maxLength={200}
              />
            </div>
            <div>
              <label className="input-label">WEBSITE</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="input-field"
                placeholder="acme.com"
                maxLength={300}
              />
            </div>
            <div className="branding-fields-wide">
              <label className="input-label">ABOUT (OPTIONAL)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="One or two sentences that describe your agency. Shown in some reports."
                maxLength={2000}
              />
            </div>
            <div>
              <label className="input-label">FONT FAMILY</label>
              <select
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="input-field"
              >
                {FONT_CHOICES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Logos */}
        <section className="branding-section">
          <div className="branding-section-head">
            <div>
              <h2>LOGOS</h2>
              <p>
                Upload one logo for each background.
                {theme === "dark" ? " Dark variant is in use." : " Light variant is in use."}
                {" "}A dark variant is optional - if missing, your light logo will be used on dark reports.
              </p>
            </div>
          </div>

          <input
            ref={lightInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
            className="hidden"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChosen(f, "light"); }}
          />
          <input
            ref={darkInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
            className="hidden"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChosen(f, "dark"); }}
          />

          <div className="logo-grid">
            <LogoSlot
              title="LIGHT-BACKGROUND LOGO"
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
              title="DARK-BACKGROUND LOGO"
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

          {extracting && <p className="branding-note">Extracting colors from logo...</p>}
        </section>

        {/* Brand colors */}
        <section className="branding-section">
          <div className="branding-section-head">
            <div>
              <h2>BRAND COLORS</h2>
              <p>Defaults follow your theme. Auto-extracted when you upload a light logo. Click a swatch to override.</p>
            </div>
          </div>
          <div className="color-grid">
            <ColorSwatch
              label="PRIMARY"
              hint="Headings & main text"
              value={primary}
              onChange={setPrimary}
            />
            <ColorSwatch
              label="SECONDARY"
              hint="Body & supporting text"
              value={secondary}
              onChange={setSecondary}
            />
            <ColorSwatch
              label={theme === "dark" ? "ACCENT (DARK THEME)" : "ACCENT (LIGHT THEME)"}
              hint={
                theme === "dark"
                  ? (logoDark ? "From your dark logo" : "Add a dark logo to extract")
                  : "From your light logo"
              }
              value={theme === "dark" ? accentDark : accent}
              onChange={(v) => (theme === "dark" ? setAccentDark(v) : setAccent(v))}
            />
          </div>
          <div className="branding-meta-row">
            <span>OTHER THEME ACCENT:</span>
            <span
              className="branding-color-chip"
              style={{ background: theme === "dark" ? accent : accentDark }}
            />
            <span className="mono">{(theme === "dark" ? accent : accentDark).toUpperCase()}</span>
            <span>· auto-extracted from your {theme === "dark" ? "light" : "dark"} logo</span>
          </div>
        </section>

        {/* Report Rules */}
        <section className="branding-section" id="report-rules">
          <div className="branding-section-head">
            <div>
              <h2>REPORT RULES (OPTIONAL)</h2>
              <p>UX guidelines the AI should respect in every report you generate. One rule per line.</p>
            </div>
            <span className="branding-pill">
              {countLines(reportDos)} DO · {countLines(reportDonts)} DON&apos;T
            </span>
          </div>
          <div className="rules-grid">
            <div>
              <label className="input-label" style={{ color: "var(--green)" }}>DO</label>
              <textarea
                value={reportDos}
                onChange={(e) => setReportDos(e.target.value)}
                rows={6}
                className="input-field rules-textarea"
                placeholder={"Use sentence case for all headings\nFormat percentages with 1 decimal\nInclude a 1-paragraph executive summary"}
                maxLength={4000}
              />
            </div>
            <div>
              <label className="input-label" style={{ color: "var(--vermilion)" }}>DON&apos;T</label>
              <textarea
                value={reportDonts}
                onChange={(e) => setReportDonts(e.target.value)}
                rows={6}
                className="input-field rules-textarea"
                placeholder={"No emojis anywhere\nDon't use red for status colours\nAvoid filler phrases"}
                maxLength={4000}
              />
            </div>
          </div>
        </section>

        {/* Live preview */}
        <section className="branding-section">
          <div className="branding-section-head">
            <div>
              <h2>SAMPLE REPORT HEADER</h2>
              <p>Live preview of how your branded reports will look.</p>
            </div>
            <span className="branding-pill">{theme === "dark" ? "DARK THEME" : "LIGHT THEME"}</span>
          </div>
          <div
            className="branding-preview-card"
            style={{ background: previewBg, color: previewText, borderColor: previewCard }}
          >
            <div
              className="branding-preview-head"
              style={{ borderBottomColor: activeAccent }}
            >
              <img
                src={previewLogo}
                alt="logo preview"
                style={{ height: 30, maxWidth: 200, objectFit: "contain" }}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src.endsWith(DEFAULT_LOGO_LIGHT_FALLBACK)) {
                    img.style.visibility = "hidden";
                  } else {
                    img.src = DEFAULT_LOGO_LIGHT_FALLBACK;
                  }
                }}
              />
              <div style={{ textAlign: "right", color: previewMuted, fontSize: 12 }}>
                <div style={{ color: primary, fontWeight: 600, fontSize: 13 }}>Monthly SEO Performance</div>
                <div>April 1 - April 30, 2026</div>
              </div>
            </div>
            <div className="branding-preview-stats">
              <PreviewStat label="CLICKS" value="42,113" delta="+18.4%" deltaColor={activeAccent} primary={primary} muted={previewMuted} card={previewCard} />
              <PreviewStat label="IMPRESSIONS" value="1.24M" delta="+9.8%" deltaColor={activeAccent} primary={primary} muted={previewMuted} card={previewCard} />
              <PreviewStat label="CTR" value="3.4%" delta="+0.3 pts" deltaColor={previewMuted} primary={primary} muted={previewMuted} card={previewCard} />
            </div>
          </div>
        </section>

        {message && (
          <div className={`branding-message ${message.kind}`}>{message.text}</div>
        )}

        <div className="branding-actions">
          <button onClick={() => save(true)} disabled={saving} className="btn btn-primary">
            {saving ? "SAVING..." : approved ? "SAVE CHANGES" : "APPROVE & SAVE"}
          </button>
          <button onClick={() => save(false)} disabled={saving} className="btn">SAVE DRAFT</button>
          {approved && (
            <span className="pill success">APPROVED · REPORTS USE YOUR BRAND</span>
          )}
        </div>
      </div>
    </>
  );
}

function PreviewStat({
  label, value, delta, deltaColor, primary, muted, card,
}: {
  label: string; value: string; delta: string;
  deltaColor: string; primary: string; muted: string; card: string;
}) {
  return (
    <div style={{ background: card, padding: 12 }}>
      <div style={{ fontSize: 10, color: muted, textTransform: "uppercase", letterSpacing: ".1em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: primary, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 12, color: deltaColor }}>{delta}</div>
    </div>
  );
}

function ColorSwatch({
  label, value, onChange, hint,
}: {
  label: string; value: string; onChange: (v: string) => void; hint?: string;
}) {
  return (
    <label className="color-swatch">
      <div className="color-swatch-block" style={{ background: value }} />
      <div className="color-swatch-label">{label}</div>
      {hint && <div className="color-swatch-hint">{hint}</div>}
      <div className="color-swatch-controls">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="color-swatch-picker"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="input-field color-swatch-text"
          maxLength={7}
        />
      </div>
    </label>
  );
}

function ThemeOption({
  active, onClick, label, description, swatch, text,
}: {
  active: boolean; onClick: () => void; label: string; description: string;
  swatch: string; text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`theme-option${active ? " active" : ""}`}
    >
      <div className="theme-option-swatch" style={{ background: swatch, color: text }}>
        Aa
      </div>
      <div className="theme-option-info">
        <div className="theme-option-label">{label}</div>
        <div className="theme-option-desc">{description}</div>
      </div>
      {active && <span className="pill success theme-option-pill">SELECTED</span>}
    </button>
  );
}

function LogoSlot({
  title, hint, value, bg, textColor, onPick, onDrop, uploading, highlighted,
}: {
  title: string; hint: string; value: string | null;
  bg: string; textColor: string;
  onPick: () => void; onDrop: (e: React.DragEvent) => void;
  uploading: boolean; highlighted: boolean;
}) {
  const [imgErrored, setImgErrored] = useState(false);
  useEffect(() => {
    setImgErrored(false);
  }, [value]);

  const showImage = Boolean(value) && !imgErrored;

  return (
    <div className={`logo-slot${highlighted ? " active" : ""}`}>
      <div className="logo-slot-head">
        <div>
          <p className="logo-slot-title">{title}</p>
          <p className="logo-slot-hint">{hint}</p>
        </div>
        {highlighted && <span className="pill info">ACTIVE</span>}
      </div>
      <div
        onClick={onPick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="logo-slot-drop"
        style={{ background: bg, color: textColor, borderColor: textColor === "#F8FAFC" ? "rgba(248,250,252,0.25)" : "rgba(0,0,0,0.15)" }}
      >
        {showImage ? (
          <img
            src={value as string}
            alt={title}
            style={{ maxHeight: 64, maxWidth: "85%", objectFit: "contain" }}
            onError={() => setImgErrored(true)}
          />
        ) : (
          <span style={{ opacity: 0.7, fontSize: 11, textAlign: "center", lineHeight: 1.5 }}>
            {uploading
              ? "UPLOADING..."
              : imgErrored
                ? "PREVIOUS LOGO UNAVAILABLE — CLICK TO UPLOAD"
                : "CLICK OR DROP TO UPLOAD"}
          </span>
        )}
      </div>
      <div className="logo-slot-foot">
        <button type="button" onClick={onPick} className="logo-slot-btn">
          {showImage ? "REPLACE" : "UPLOAD"}
        </button>
      </div>
    </div>
  );
}

const BRANDING_CSS = `
.branding-stack {
  display: flex; flex-direction: column; gap: 24px;
}
.branding-section {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 24px;
}
.branding-section-head {
  display: flex; justify-content: space-between; align-items: start;
  gap: 16px; margin-bottom: 18px;
}
.branding-section-head h2 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink);
}
.branding-section-head p {
  font-size: 12px; color: var(--ink-3); margin-top: 4px;
}
.branding-pill {
  font-size: 10px; padding: 4px 10px;
  letter-spacing: 0.16em; text-transform: uppercase;
  border: 1px solid var(--rule); color: var(--ink-3);
}
.branding-note {
  font-size: 12px; color: var(--ink-3);
  margin-top: 12px;
}

.theme-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
}
.theme-option {
  display: flex; align-items: center; gap: 14px;
  padding: 14px;
  background: var(--bg);
  border: 1px solid var(--rule);
  cursor: pointer;
  text-align: left;
  font-family: var(--body);
  transition: border-color .15s, background .15s;
}
.theme-option:hover { border-color: var(--teal); }
.theme-option.active { border-color: var(--teal); background: rgba(0,181,181,0.06); }
.theme-option-swatch {
  width: 44px; height: 44px;
  display: grid; place-items: center;
  border: 1px solid var(--rule);
  font-weight: 700; font-size: 12px;
  flex-shrink: 0;
}
.theme-option-info { flex: 1; }
.theme-option-label {
  font-family: var(--display);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink);
}
.theme-option-desc { font-size: 11px; color: var(--ink-3); }
.theme-option-pill { margin-left: auto; }

.branding-fields {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
}
.branding-fields-wide { grid-column: 1 / -1; }

.logo-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
}
.logo-slot {
  background: var(--bg);
  border: 1px solid var(--rule);
  padding: 12px;
}
.logo-slot.active { border-color: var(--teal); }
.logo-slot-head {
  display: flex; justify-content: space-between; align-items: start;
  margin-bottom: 10px; gap: 8px;
}
.logo-slot-title {
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.10em; text-transform: uppercase;
  color: var(--ink);
}
.logo-slot-hint { font-size: 10px; color: var(--ink-3); margin-top: 2px; }
.logo-slot-drop {
  display: flex; align-items: center; justify-content: center;
  min-height: 96px;
  border: 1px dashed;
  cursor: pointer;
}
.logo-slot-foot {
  display: flex; justify-content: flex-end;
  margin-top: 10px;
}
.logo-slot-btn {
  background: none; border: none;
  color: var(--teal);
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  cursor: pointer;
}
.logo-slot-btn:hover { color: var(--vermilion); }

.color-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
}
.color-swatch {
  display: block;
  background: var(--bg);
  border: 1px solid var(--rule);
  padding: 12px;
  cursor: pointer;
}
.color-swatch-block {
  height: 56px; margin-bottom: 10px;
  border: 1px solid var(--rule);
}
.color-swatch-label {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.color-swatch-hint {
  font-size: 10px; color: var(--ink-3); opacity: 0.8;
  margin-bottom: 8px;
}
.color-swatch-controls {
  display: flex; align-items: center; gap: 8px;
  margin-top: 6px;
}
.color-swatch-picker {
  width: 28px; height: 28px;
  border: none; background: transparent;
  padding: 0; cursor: pointer;
}
.color-swatch-text {
  flex: 1; font-family: var(--mono);
  font-size: 12px;
  padding: 6px 8px;
}

.branding-meta-row {
  display: flex; align-items: center; gap: 8px;
  margin-top: 14px;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  flex-wrap: wrap;
}
.branding-meta-row .mono { font-family: var(--mono); }
.branding-color-chip {
  width: 14px; height: 14px;
  border: 1px solid var(--rule);
  display: inline-block;
}

.rules-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
}
.rules-textarea {
  font-family: var(--mono);
  font-size: 12px;
}

.branding-preview-card {
  padding: 22px;
  border: 1px solid;
}
.branding-preview-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 12px;
  border-bottom: 2px solid;
}
.branding-preview-stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
}

.branding-message {
  padding: 12px 16px;
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  font-size: 12px;
}
.branding-message.ok { color: var(--green); border-color: rgba(74,222,128,0.4); }
.branding-message.err { color: var(--vermilion); border-color: rgba(255,107,74,0.4); }

.branding-actions {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
  padding-top: 8px;
}

@media (max-width: 980px) {
  .theme-grid, .branding-fields, .logo-grid, .color-grid, .rules-grid,
  .branding-preview-stats {
    grid-template-columns: 1fr;
  }
}
`;
