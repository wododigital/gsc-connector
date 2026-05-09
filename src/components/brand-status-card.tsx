import Link from "next/link";

interface BrandProfileLite {
  companyName: string | null;
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
  profile: BrandProfileLite | null;
}

const FALLBACK_PRIMARY = "#00B3B3";
const FALLBACK_SECONDARY = "#0E1420";
const FALLBACK_ACCENT = "#6366F1";

/**
 * Server component that surfaces the user's brand profile state on the
 * dashboard. Three states:
 *   - No profile     -> CTA to set one up
 *   - Draft          -> CTA to approve so reports start using it
 *   - Approved       -> Live preview with logo + colors + edit link
 */
export function BrandStatusCard({ profile }: Props) {
  if (!profile) {
    return (
      <section className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Brand Profile
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Reports currently use OMG Bridge default branding.
            </p>
          </div>
          <span className="badge badge-muted" style={{ fontSize: "11px" }}>Not set up</span>
        </div>
        <div
          className="rounded-lg p-4 flex items-center gap-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed var(--glass-border)" }}
        >
          <div
            className="rounded-md flex items-center justify-center shrink-0"
            style={{ width: 56, height: 56, background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)" }}
          >
            <span className="text-2xl" style={{ color: "var(--text-muted)" }}>+</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              Add your brand to white-label every report
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Upload a logo, we&apos;ll extract dominant colors automatically. Takes about 30 seconds.
            </p>
          </div>
          <Link href="/dashboard/branding" className="btn-primary btn-primary-sm shrink-0">
            Set up brand
          </Link>
        </div>
      </section>
    );
  }

  const primary = profile.primaryColor || FALLBACK_PRIMARY;
  const secondary = profile.secondaryColor || FALLBACK_SECONDARY;
  const accent = profile.accentColor || FALLBACK_ACCENT;
  const company = profile.companyName?.trim();
  const theme: "light" | "dark" = profile.reportTheme === "dark" ? "dark" : "light";
  const previewLogoForTheme =
    theme === "dark"
      ? (profile.logoUrlDark || profile.logoUrl)
      : profile.logoUrl;
  const previewBg = theme === "dark" ? "#0F172A" : "#FFFFFF";
  const previewText = theme === "dark" ? "#F8FAFC" : "#1A1A2E";

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Brand Profile
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {profile.isApproved
              ? "Generated reports use these brand values."
              : "Draft - reports still use OMG defaults until you approve this brand."}
          </p>
        </div>
        {profile.isApproved ? (
          <span className="badge badge-success" style={{ fontSize: "11px" }}>Active</span>
        ) : (
          <span className="badge badge-warning" style={{ fontSize: "11px" }}>Draft</span>
        )}
      </div>

      {/* Live preview row: logo on theme bg + color swatches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          className="rounded-lg p-3 flex items-center justify-center md:col-span-1"
          style={{ background: previewBg, color: previewText, border: "1px solid var(--glass-border)", minHeight: 92 }}
        >
          {previewLogoForTheme ? (
            <img src={previewLogoForTheme} alt={company ?? "Brand logo"} style={{ maxHeight: 56, maxWidth: "100%", objectFit: "contain" }} />
          ) : (
            <span className="text-xs" style={{ opacity: 0.55 }}>No logo uploaded</span>
          )}
        </div>

        <div
          className="rounded-lg p-3 md:col-span-2"
          style={{ background: secondary, color: "#fff" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold truncate" style={{ maxWidth: 180 }}>
              {company ?? "Untitled brand"}
            </span>
            <span className="text-[10px]" style={{ color: primary, opacity: 0.9 }}>
              Sample report header
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Swatch label="Primary" value={primary} />
            <Swatch label="Secondary" value={secondary} dark />
            <Swatch label="Accent" value={accent} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 gap-3 flex-wrap" style={{ borderTop: "1px solid var(--glass-border)" }}>
        <div className="flex flex-wrap gap-3 text-xs items-center" style={{ color: "var(--text-muted)" }}>
          <span className="badge" style={{ fontSize: "10px", background: theme === "dark" ? "rgba(15,23,42,0.6)" : "rgba(248,250,252,0.6)", color: theme === "dark" ? "#F8FAFC" : "#1A1A2E", border: "1px solid var(--glass-border)" }}>
            {theme === "dark" ? "Dark theme" : "Light theme"}
          </span>
          <span>
            Logos: <span style={{ color: profile.logoUrl ? "var(--success)" : "var(--text-muted)" }}>light {profile.logoUrl ? "✓" : "—"}</span>
            {" · "}
            <span style={{ color: profile.logoUrlDark ? "var(--success)" : "var(--text-muted)" }}>dark {profile.logoUrlDark ? "✓" : "—"}</span>
          </span>
          <span>
            Font: <span style={{ color: "var(--text-secondary)" }}>{profile.fontFamily ?? "Inter"}</span>
          </span>
        </div>
        <div className="flex gap-2">
          {!profile.isApproved && (
            <Link href="/dashboard/branding" className="btn-primary btn-primary-sm">
              Approve brand
            </Link>
          )}
          <Link href="/dashboard/branding" className="btn-ghost btn-ghost-sm">
            {profile.isApproved ? "Edit brand" : "Continue setup"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Swatch({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div
      className="rounded p-2 flex flex-col gap-1"
      style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.10)" }}
    >
      <div className="rounded" style={{ background: value, height: 26, border: "1px solid rgba(255,255,255,0.1)" }} />
      <div className="flex items-center justify-between">
        <span className="text-[10px] opacity-70">{label}</span>
        <span className="text-[10px] font-mono opacity-90">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}
