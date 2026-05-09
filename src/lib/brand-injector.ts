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
  primaryColor: string;
  secondaryColor: string;
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
}

export interface BrandProfileLike {
  companyName?: string | null;
  logoUrl?: string | null;
  logoUrlDark?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
  website?: string | null;
  description?: string | null;
  reportTheme?: string | null;
  isApproved?: boolean | null;
}

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const DEFAULT_LOGO_LIGHT = "/OMG Rectangle LOGO Light BG.svg";
const DEFAULT_LOGO_DARK = "/OMG Rectangle LOGO Dark BG.svg";

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
 *   - if the file isn't readable, falls back to a properly-encoded
 *     APP_URL-prefixed absolute URL (still better than a bare relative path)
 */
function resolveLogoSrc(rawInput: string | null | undefined, fallback: string): string {
  const raw = rawInput?.trim();
  if (raw) {
    if (raw.startsWith("data:") || /^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/")) {
      return readPublicAsDataUri(raw) ?? absolutize(raw);
    }
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

const OMG_BASE = {
  companyName: "OMG Bridge",
  primaryColor: "#00B3B3",
  secondaryColor: "#0E1420",
  accentColor: "#6366F1",
  fontFamily: "Inter",
  website: "bridge.theomg.ai",
  description: "OMG Bridge connects Google Search Console, Analytics 4 and Business Profile to AI assistants via MCP.",
};

export const OMG_DEFAULTS: BrandValues = {
  ...OMG_BASE,
  logoUrl: "",       // resolved lazily so process.cwd() is correct at call time
  logoUrlLight: "",
  logoUrlDark: "",
  reportTheme: "light",
  ...LIGHT_THEME_COLORS,
};

export function resolveBrandValues(brand: BrandProfileLike | null | undefined): BrandValues {
  const useUserBrand = Boolean(brand?.isApproved);
  const theme = normalizeTheme(useUserBrand ? brand?.reportTheme : "light");
  const themeColors = theme === "dark" ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

  const lightLogoInput = useUserBrand ? brand?.logoUrl : null;
  const darkLogoInput = useUserBrand ? brand?.logoUrlDark : null;

  return {
    companyName: useUserBrand ? (brand!.companyName?.trim() || OMG_BASE.companyName) : OMG_BASE.companyName,
    logoUrl: pickThemeAwareLogo(brand, useUserBrand, theme),
    logoUrlLight: resolveLogoSrc(lightLogoInput, DEFAULT_LOGO_LIGHT),
    logoUrlDark: darkLogoInput
      ? resolveLogoSrc(darkLogoInput, DEFAULT_LOGO_DARK)
      : resolveLogoSrc(null, DEFAULT_LOGO_DARK),
    primaryColor: useUserBrand ? (brand!.primaryColor?.trim() || OMG_BASE.primaryColor) : OMG_BASE.primaryColor,
    secondaryColor: useUserBrand ? (brand!.secondaryColor?.trim() || OMG_BASE.secondaryColor) : OMG_BASE.secondaryColor,
    accentColor: useUserBrand ? (brand!.accentColor?.trim() || OMG_BASE.accentColor) : OMG_BASE.accentColor,
    fontFamily: useUserBrand ? (brand!.fontFamily?.trim() || OMG_BASE.fontFamily) : OMG_BASE.fontFamily,
    website: useUserBrand ? (brand!.website?.trim() || OMG_BASE.website) : OMG_BASE.website,
    description: useUserBrand ? (brand!.description?.trim() || OMG_BASE.description) : OMG_BASE.description,
    reportTheme: theme,
    ...themeColors,
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
  };

  // {{brand.x}} or {{brand.x || "default"}} or {{brand.x || 'default'}}
  return body.replace(
    /\{\{\s*(brand\.[a-zA-Z]+)(?:\s*\|\|\s*(?:"[^"]*"|'[^']*'))?\s*\}\}/g,
    (_match, key) => map[key] ?? _match
  );
}

/**
 * Build the clipboard-ready prompt: brand-injected body with the standard
 * "paste this into your AI assistant" header prepended.
 */
export function buildClipboardPrompt(body: string, brand: BrandProfileLike | null | undefined): string {
  const injected = injectBrandProfile(body, brand);
  const header =
    "# OMG Bridge Report Prompt\n\n" +
    "Paste this into your AI assistant (Claude, ChatGPT, Cursor) with your OMG Bridge MCP connection active.\n\n" +
    "---\n\n";
  return header + injected;
}
