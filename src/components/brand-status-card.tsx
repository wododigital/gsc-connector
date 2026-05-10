import Link from "next/link";

interface BrandProfileLite {
  companyName: string | null;
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

function countRules(s: string | null): number {
  if (!s) return 0;
  return s.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0).length;
}

interface Props {
  profile: BrandProfileLite | null;
}

const FALLBACK_PRIMARY = "#00B5B5";
const FALLBACK_SECONDARY = "#0E1420";
const FALLBACK_ACCENT = "#6366F1";

/**
 * Server component that surfaces the user's brand profile state on the
 * dashboard, restyled for Swiss Dark Modernist:
 *   - No profile: surface-1 card with dashed border + CTA
 *   - Draft: amber pill, prompt to approve
 *   - Approved: teal-edged card with live preview
 */
export function BrandStatusCard({ profile }: Props) {
  if (!profile) {
    return (
      <>
        <style>{BRAND_CARD_CSS}</style>
        <section className="brand-card brand-card-empty">
          <div className="brand-head">
            <div>
              <div className="eyebrow">BRAND PROFILE</div>
              <p className="brand-sub">Reports currently use OMG Bridge default branding.</p>
            </div>
            <span className="pill">NOT SET UP</span>
          </div>
          <div className="brand-empty-row">
            <div className="brand-empty-icon">+</div>
            <div className="brand-empty-text">
              <p className="brand-empty-title">Add your brand to white-label every report</p>
              <p className="brand-empty-desc">
                Upload a logo, we&apos;ll extract dominant colors automatically. Takes about 30 seconds.
              </p>
            </div>
            <Link href="/dashboard/branding" className="btn btn-primary">
              + SET UP BRAND
            </Link>
          </div>
        </section>
      </>
    );
  }

  const primary = profile.primaryColor || FALLBACK_PRIMARY;
  const secondary = profile.secondaryColor || FALLBACK_SECONDARY;
  const company = profile.companyName?.trim();
  const theme: "light" | "dark" = profile.reportTheme === "dark" ? "dark" : "light";
  const accent =
    theme === "dark"
      ? (profile.accentColorDark || profile.accentColor || FALLBACK_ACCENT)
      : (profile.accentColor || profile.accentColorDark || FALLBACK_ACCENT);
  const previewLogoForTheme =
    theme === "dark"
      ? (profile.logoUrlDark || profile.logoUrl)
      : profile.logoUrl;
  const previewBg = theme === "dark" ? "#0F172A" : "#FFFFFF";
  const previewText = theme === "dark" ? "#F8FAFC" : "#1A1A2E";

  return (
    <>
      <style>{BRAND_CARD_CSS}</style>
      <section className={`brand-card${profile.isApproved ? " brand-card-active" : ""}`}>
        <div className="brand-head">
          <div>
            <div className="eyebrow">BRAND PROFILE</div>
            <p className="brand-sub">
              {profile.isApproved
                ? "Generated reports use these brand values."
                : "Draft - reports still use OMG defaults until you approve this brand."}
            </p>
          </div>
          {profile.isApproved ? (
            <span className="pill success">ACTIVE</span>
          ) : (
            <span className="pill warn">DRAFT</span>
          )}
        </div>

        <div className="brand-body">
          <div
            className="brand-logo-frame"
            style={{ background: previewBg, color: previewText }}
          >
            {previewLogoForTheme ? (
              <img
                src={previewLogoForTheme}
                alt={company ?? "Brand logo"}
                style={{ maxHeight: 56, maxWidth: "100%", objectFit: "contain" }}
              />
            ) : (
              <span style={{ opacity: 0.55, fontSize: 11 }}>NO LOGO UPLOADED</span>
            )}
          </div>

          <div className="brand-preview" style={{ background: secondary, color: "#fff" }}>
            <div className="brand-preview-head">
              <span className="brand-preview-name">{company ?? "UNTITLED BRAND"}</span>
              <span className="brand-preview-mini" style={{ color: primary }}>
                SAMPLE REPORT HEADER
              </span>
            </div>
            <div className="brand-swatches">
              <Swatch label="PRIMARY" value={primary} />
              <Swatch label="SECONDARY" value={secondary} dark />
              <Swatch label="ACCENT" value={accent} />
            </div>
          </div>
        </div>

        <div className="brand-footer">
          <div className="brand-meta">
            <span className="brand-meta-pill">{theme === "dark" ? "DARK THEME" : "LIGHT THEME"}</span>
            <span>
              LOGOS: {profile.logoUrl ? "LIGHT ✓" : "LIGHT —"}
              {" · "}
              {profile.logoUrlDark ? "DARK ✓" : "DARK —"}
            </span>
            <span>
              RULES: {countRules(profile.reportDos)} DO · {countRules(profile.reportDonts)} DON&apos;T
            </span>
            <span>FONT: {profile.fontFamily ?? "INTER"}</span>
          </div>
          <div className="brand-cta">
            {!profile.isApproved && (
              <Link href="/dashboard/branding" className="btn btn-primary">
                APPROVE BRAND
              </Link>
            )}
            <Link href="/dashboard/branding" className="btn">
              {profile.isApproved ? "EDIT BRAND" : "CONTINUE SETUP"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Swatch({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div
      style={{
        background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.10)",
        padding: 8,
        display: "flex", flexDirection: "column", gap: 6,
      }}
    >
      <div
        style={{
          background: value,
          height: 26,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: "0.14em" }}>{label}</span>
        <span style={{ fontSize: 9, opacity: 0.9, fontFamily: "var(--mono)" }}>
          {value.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

const BRAND_CARD_CSS = `
.brand-card {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 20px 22px;
}
.brand-card-active { border-color: var(--card-rule); box-shadow: 0 0 0 1px var(--teal-glow); }
.brand-head {
  display: flex; justify-content: space-between; align-items: start; gap: 16px;
  margin-bottom: 16px;
}
.brand-head .eyebrow {
  font-family: var(--display);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--ink);
}
.brand-head .brand-sub {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 4px;
}
.brand-empty-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 18px;
  border: 1px dashed var(--rule-strong);
}
.brand-empty-icon {
  width: 56px; height: 56px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--rule);
  display: grid; place-items: center;
  color: var(--ink-3);
  font-size: 24px;
}
.brand-empty-title {
  font-family: var(--display);
  font-weight: 600; font-size: 14px;
  text-transform: uppercase; letter-spacing: -0.01em;
  color: var(--ink); margin-bottom: 4px;
}
.brand-empty-desc { font-size: 12px; color: var(--ink-3); }

.brand-body {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) 2fr;
  gap: 14px;
  margin-bottom: 16px;
}
.brand-logo-frame {
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--rule);
  min-height: 110px;
  padding: 12px;
}
.brand-preview { padding: 14px; }
.brand-preview-head {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
}
.brand-preview-name {
  font-family: var(--display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  max-width: 240px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.brand-preview-mini {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.brand-swatches {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}
.brand-footer {
  padding-top: 12px;
  border-top: 1px solid var(--rule);
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  flex-wrap: wrap;
}
.brand-meta {
  display: flex; flex-wrap: wrap; gap: 14px;
  font-size: 10px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-3);
  align-items: center;
}
.brand-meta-pill {
  padding: 3px 8px; border: 1px solid var(--rule);
  color: var(--ink-2);
}
.brand-cta { display: flex; gap: 8px; }

@media (max-width: 980px) {
  .brand-body { grid-template-columns: 1fr; }
}
`;
