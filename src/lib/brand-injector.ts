/**
 * Brand profile injector.
 * Replaces {{brand.*}} placeholders in prompt bodies with the user's brand
 * values, falling back to OMG Bridge defaults when no approved profile exists.
 *
 * Logo handling: any logoUrl that points at a file under /public is embedded
 * as a base64 data URI so the generated report HTML renders correctly when
 * viewed outside the OMG Bridge origin (Claude artifacts, downloaded HTML,
 * Cursor, etc.). Absolute external URLs are passed through untouched.
 *
 * Server-only - imports `fs` and `path`. Do not import from a client component.
 *
 * Used by:
 *   - User-facing prompt copy flow (src/app/api/prompts/...)
 *   - MCP get_report_template tool
 */

import fs from "fs";
import path from "path";

export type ReportTheme = "light" | "dark";

export interface BrandValues {
  companyName: string;
  logoUrl: string;            // Logo for the active theme (data URI when local)
  logoUrlLight: string;       // Always the light-bg variant
  logoUrlDark: string;        // Always the dark-bg variant
  /** Main text/heading color. Theme-adaptive default (dark on light, light on dark). */
  primaryColor: string;
  /** Secondary text/surface color. Theme-adaptive default. */
  secondaryColor: string;
  /** The brand's vibrant highlight - used for accents, links, key callouts. */
  accentColor: string;
  fontFamily: string;
  website: string;
  description: string;
  reportTheme: ReportTheme;
  bgColor: string;
  textColor: string;
  textMutedColor: string;
  cardBgColor: string;
  borderColor: string;
  reportDos: string;          // Raw text - one rule per line, blank when none
  reportDonts: string;        // Raw text - one rule per line, blank when none
  /** Composed block: full "### Report Rules:" section, or empty string. */
  guidelines: string;
}

export interface BrandProfileLike {
  companyName?: string | null;
  logoUrl?: string | null;
  logoUrlDark?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  accentColorDark?: string | null;
  lightBgColor?: string | null;
  darkBgColor?: string | null;
  fontFamily?: string | null;
  website?: string | null;
  description?: string | null;
  reportTheme?: string | null;
  reportDos?: string | null;
  reportDonts?: string | null;
  isApproved?: boolean | null;
}

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
// Defaults point at assets that actually exist in /public so the fallback
// never resolves to a 404. Reports render the user's uploaded logo first;
// these only kick in when no upload has happened at all.
const DEFAULT_LOGO_LIGHT = "/omg-logo-light.webp";
const DEFAULT_LOGO_DARK = "/omg-logo-light.webp";

const LIGHT_THEME_COLORS = {
  bgColor: "#FFFFFF",
  textColor: "#1A1A2E",
  textMutedColor: "#6B7280",
  cardBgColor: "#F9FAFB",
  borderColor: "#E5E7EB",
};

const DARK_THEME_COLORS = {
  bgColor: "#0F172A",
  textColor: "#F8FAFC",
  textMutedColor: "#94A3B8",
  cardBgColor: "#1E293B",
  borderColor: "rgba(148, 163, 184, 0.18)",
};

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Convert a /public-relative path to a base64 data URI. Returns null if the
 * file is missing, not allow-listed, or escapes the public/ root. Cached so
 * repeated injection passes don't re-read the same file.
 */
const dataUriCache = new Map<string, string>();
function readPublicAsDataUri(rel: string): string | null {
  if (!rel.startsWith("/")) return null;
  if (dataUriCache.has(rel)) return dataUriCache.get(rel)!;
  try {
    const ext = path.extname(rel).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) return null;
    const publicRoot = path.join(process.cwd(), "public");
    const fullPath = path.join(publicRoot, rel.replace(/^\/+/, ""));
    if (!fullPath.startsWith(publicRoot + path.sep)) return null; // path traversal guard
    if (!fs.existsSync(fullPath)) return null;
    const buf = fs.readFileSync(fullPath);
    const uri = `data:${mime};base64,${buf.toString("base64")}`;
    dataUriCache.set(rel, uri);
    return uri;
  } catch {
    return null;
  }
}

function absolutize(rel: string): string {
  // URL-encode each path segment so spaces and special chars survive.
  const encoded = rel
    .split("/")
    .map((seg) => (seg ? encodeURIComponent(seg) : seg))
    .join("/");
  return `${APP_URL}${encoded.startsWith("/") ? "" : "/"}${encoded}`;
}

/**
 * Best-effort logo URL resolver.
 *   - data:... and http(s)://...   -> passed through unchanged
 *   - /uploads/... or /OMG ....svg -> embedded as a base64 data URI
 *   - if the user-supplied file is missing on disk -> empty string (we never
 *     silently substitute the default in that case, so reports don't pull a
 *     stale OMG default after the user has set their own logo)
 *   - if no rawInput at all -> fall back to the platform default
 */
function resolveLogoSrc(rawInput: string | null | undefined, fallback: string): string {
  const raw = rawInput?.trim();
  if (raw) {
    if (raw.startsWith("data:") || /^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/")) {
      const dataUri = readPublicAsDataUri(raw);
      if (dataUri) return dataUri;
      // The user uploaded a logo but the file isn't on disk (cleared cache,
      // ephemeral host, etc). Return empty so the report omits the image
      // instead of swapping in an unrelated default.
      return "";
    }
    return "";
  }
  return readPublicAsDataUri(fallback) ?? absolutize(fallback);
}

function pickThemeAwareLogo(
  profile: BrandProfileLike | null | undefined,
  useUserBrand: boolean,
  theme: ReportTheme
): string {
  if (useUserBrand && profile) {
    if (theme === "dark") {
      // Prefer the dark variant; if absent, the light logo is better than nothing.
      const dark = profile.logoUrlDark?.trim();
      if (dark) return resolveLogoSrc(dark, DEFAULT_LOGO_DARK);
      const light = profile.logoUrl?.trim();
      if (light) return resolveLogoSrc(light, DEFAULT_LOGO_DARK);
    } else {
      const light = profile.logoUrl?.trim();
      if (light) return resolveLogoSrc(light, DEFAULT_LOGO_LIGHT);
    }
  }
  return resolveLogoSrc(null, theme === "dark" ? DEFAULT_LOGO_DARK : DEFAULT_LOGO_LIGHT);
}

function normalizeTheme(value: string | null | undefined): ReportTheme {
  return value === "dark" ? "dark" : "light";
}

/**
 * Theme-adaptive defaults for the user-editable color slots.
 * - primary  = main heading/text color (dark on light, light on dark)
 * - secondary = softer text / surface accent
 * - accent    = the brand's vibrant highlight (defaults to OMG teal regardless of theme)
 */
export const THEME_COLOR_DEFAULTS: Record<ReportTheme, { primary: string; secondary: string; accent: string }> = {
  light: { primary: "#0E1420", secondary: "#374151", accent: "#00B3B3" },
  dark:  { primary: "#F8FAFC", secondary: "#CBD5E1", accent: "#00B3B3" },
};

const OMG_BASE = {
  companyName: "OMG Bridge",
  fontFamily: "Inter",
  website: "bridge.theomg.ai",
  description: "OMG Bridge connects Google Search Console, Analytics 4 and Business Profile to AI assistants via MCP.",
};

export const OMG_DEFAULTS: BrandValues = {
  ...OMG_BASE,
  logoUrl: "",       // resolved lazily so process.cwd() is correct at call time
  logoUrlLight: "",
  logoUrlDark: "",
  primaryColor: THEME_COLOR_DEFAULTS.light.primary,
  secondaryColor: THEME_COLOR_DEFAULTS.light.secondary,
  accentColor: THEME_COLOR_DEFAULTS.light.accent,
  reportTheme: "light",
  ...LIGHT_THEME_COLORS,
  reportDos: "",
  reportDonts: "",
  guidelines: "",
};

function splitRules(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\-*•]+/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 30);
}

function composeGuidelines(dos: string[], donts: string[]): string {
  if (dos.length === 0 && donts.length === 0) return "";
  const lines: string[] = ["### Report Rules (apply to every report you generate):"];
  if (dos.length > 0) {
    lines.push("", "Do:", ...dos.map((r) => `- ${r}`));
  }
  if (donts.length > 0) {
    lines.push("", "Don't:", ...donts.map((r) => `- ${r}`));
  }
  return lines.join("\n");
}

export function resolveBrandValues(brand: BrandProfileLike | null | undefined): BrandValues {
  const useUserBrand = Boolean(brand?.isApproved);
  const theme = normalizeTheme(useUserBrand ? brand?.reportTheme : "light");
  const baseThemeColors = theme === "dark" ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
  const slotDefaults = THEME_COLOR_DEFAULTS[theme];

  // Honour custom background colors when the user has set them for the active
  // theme. Falls back to the platform theme defaults otherwise.
  const customBg = useUserBrand
    ? (theme === "dark" ? brand?.darkBgColor?.trim() : brand?.lightBgColor?.trim())
    : undefined;
  const themeColors = customBg
    ? { ...baseThemeColors, bgColor: customBg }
    : baseThemeColors;

  const lightLogoInput = useUserBrand ? brand?.logoUrl : null;
  const darkLogoInput = useUserBrand ? brand?.logoUrlDark : null;

  const dos = useUserBrand ? splitRules(brand?.reportDos) : [];
  const donts = useUserBrand ? splitRules(brand?.reportDonts) : [];

  // Pick the accent that matches the active theme. If the user has only
  // uploaded one logo, the missing accent falls back to the other variant
  // (better than reverting to the OMG default teal mid-flow).
  const accentLight = brand?.accentColor?.trim();
  const accentDark = brand?.accentColorDark?.trim();
  const themeAccent = useUserBrand
    ? (theme === "dark"
        ? (accentDark || accentLight || slotDefaults.accent)
        : (accentLight || accentDark || slotDefaults.accent))
    : slotDefaults.accent;

  return {
    companyName: useUserBrand ? (brand!.companyName?.trim() || OMG_BASE.companyName) : OMG_BASE.companyName,
    logoUrl: pickThemeAwareLogo(brand, useUserBrand, theme),
    logoUrlLight: resolveLogoSrc(lightLogoInput, DEFAULT_LOGO_LIGHT),
    logoUrlDark: darkLogoInput
      ? resolveLogoSrc(darkLogoInput, DEFAULT_LOGO_DARK)
      : resolveLogoSrc(null, DEFAULT_LOGO_DARK),
    primaryColor: useUserBrand ? (brand!.primaryColor?.trim() || slotDefaults.primary) : slotDefaults.primary,
    secondaryColor: useUserBrand ? (brand!.secondaryColor?.trim() || slotDefaults.secondary) : slotDefaults.secondary,
    accentColor: themeAccent,
    fontFamily: useUserBrand ? (brand!.fontFamily?.trim() || OMG_BASE.fontFamily) : OMG_BASE.fontFamily,
    website: useUserBrand ? (brand!.website?.trim() || OMG_BASE.website) : OMG_BASE.website,
    description: useUserBrand ? (brand!.description?.trim() || OMG_BASE.description) : OMG_BASE.description,
    reportTheme: theme,
    ...themeColors,
    reportDos: dos.join("\n"),
    reportDonts: donts.join("\n"),
    guidelines: composeGuidelines(dos, donts),
  };
}

/**
 * Replace handlebars-style brand placeholders inside a prompt body.
 * Supports both {{brand.x}} and {{brand.x || "fallback"}} forms.
 * Anything else (questions, instructions) is left untouched so the LLM still
 * reads it verbatim.
 */
export function injectBrandProfile(body: string, brand: BrandProfileLike | null | undefined): string {
  const v = resolveBrandValues(brand);
  const map: Record<string, string> = {
    "brand.companyName": v.companyName,
    "brand.logoUrl": v.logoUrl,
    "brand.logoUrlLight": v.logoUrlLight,
    "brand.logoUrlDark": v.logoUrlDark,
    "brand.primaryColor": v.primaryColor,
    "brand.secondaryColor": v.secondaryColor,
    "brand.accentColor": v.accentColor,
    "brand.fontFamily": v.fontFamily,
    "brand.website": v.website,
    "brand.description": v.description,
    "brand.reportTheme": v.reportTheme,
    "brand.bgColor": v.bgColor,
    "brand.textColor": v.textColor,
    "brand.textMutedColor": v.textMutedColor,
    "brand.cardBgColor": v.cardBgColor,
    "brand.borderColor": v.borderColor,
    "brand.reportDos": v.reportDos,
    "brand.reportDonts": v.reportDonts,
    "brand.guidelines": v.guidelines,
  };

  // {{brand.x}} or {{brand.x || "default"}} or {{brand.x || 'default'}}
  return body.replace(
    /\{\{\s*(brand\.[a-zA-Z]+)(?:\s*\|\|\s*(?:"[^"]*"|'[^']*'))?\s*\}\}/g,
    (_match, key) => map[key] ?? _match
  );
}

/**
 * Build the clipboard-ready prompt: brand-injected body with the standard
 * "paste this into your AI assistant" header prepended, plus the same STOP
 * preamble that the MCP get_report_template tool emits, so direct-paste flows
 * enforce the mandatory questions just like MCP-driven flows.
 */
export function buildClipboardPrompt(body: string, brand: BrandProfileLike | null | undefined): string {
  const injected = injectBrandProfile(body, brand);
  const header =
    "# OMG Bridge Report Prompt\n\n" +
    "Paste this into your AI assistant (Claude, ChatGPT, Cursor) with your OMG Bridge MCP connection active.\n\n" +
    "---\n\n";
  const stopPreamble =
    "## STOP. READ THIS BEFORE GENERATING.\n\n" +
    "You MUST collect answers to ALL of the following BEFORE you produce the report.\n" +
    "Do NOT use defaults. Do NOT guess. If any answer is missing, ask for it and wait.\n\n" +
    "1. **Output format** - choose ONE:\n" +
    "   - `webpage` -> self-contained interactive HTML artifact (charts, tables, brand styles inline)\n" +
    "   - `pdf`     -> print-ready HTML styled for letter/A4 with @media print rules; user will Save as PDF\n" +
    "   - `excel`   -> structured workbook content. Output a fenced ```csv block per sheet, prefixed by `# Sheet: <name>`. No charts.\n" +
    "2. **Property / site** - the GSC site, GA4 property or GBP location to query. Never assume.\n" +
    "3. **Date range** - explicit start and end dates (or a named range like \"last 28 days\"). Never assume.\n\n" +
    "If the user has not explicitly provided all three, STOP and ask for the missing pieces.\n" +
    "Only after all three are answered may you proceed with the prompt below.\n\n" +
    "---\n\n";
  return header + stopPreamble + injected;
}
