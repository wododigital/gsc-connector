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

export interface BrandValues {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  website: string;
  description: string;
}

export interface BrandProfileLike {
  companyName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
  website?: string | null;
  description?: string | null;
  isApproved?: boolean | null;
}

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const DEFAULT_LOGO_PATH = "/OMG Rectangle LOGO Light BG.svg";

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
function resolveLogoUrl(input: string | null | undefined): string {
  const raw = input?.trim();
  if (raw) {
    if (raw.startsWith("data:") || /^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/")) {
      return readPublicAsDataUri(raw) ?? absolutize(raw);
    }
  }
  return readPublicAsDataUri(DEFAULT_LOGO_PATH) ?? absolutize(DEFAULT_LOGO_PATH);
}

export const OMG_DEFAULTS: BrandValues = {
  companyName: "OMG Bridge",
  logoUrl: "", // resolved lazily by resolveBrandValues so process.cwd() is correct
  primaryColor: "#00B3B3",
  secondaryColor: "#0E1420",
  accentColor: "#6366F1",
  fontFamily: "Inter",
  website: "bridge.theomg.ai",
  description: "OMG Bridge connects Google Search Console, Analytics 4 and Business Profile to AI assistants via MCP.",
};

export function resolveBrandValues(brand: BrandProfileLike | null | undefined): BrandValues {
  const useUserBrand = Boolean(brand?.isApproved);
  return {
    companyName: useUserBrand ? (brand!.companyName?.trim() || OMG_DEFAULTS.companyName) : OMG_DEFAULTS.companyName,
    logoUrl: resolveLogoUrl(useUserBrand ? brand!.logoUrl : null),
    primaryColor: useUserBrand ? (brand!.primaryColor?.trim() || OMG_DEFAULTS.primaryColor) : OMG_DEFAULTS.primaryColor,
    secondaryColor: useUserBrand ? (brand!.secondaryColor?.trim() || OMG_DEFAULTS.secondaryColor) : OMG_DEFAULTS.secondaryColor,
    accentColor: useUserBrand ? (brand!.accentColor?.trim() || OMG_DEFAULTS.accentColor) : OMG_DEFAULTS.accentColor,
    fontFamily: useUserBrand ? (brand!.fontFamily?.trim() || OMG_DEFAULTS.fontFamily) : OMG_DEFAULTS.fontFamily,
    website: useUserBrand ? (brand!.website?.trim() || OMG_DEFAULTS.website) : OMG_DEFAULTS.website,
    description: useUserBrand ? (brand!.description?.trim() || OMG_DEFAULTS.description) : OMG_DEFAULTS.description,
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
    "brand.primaryColor": v.primaryColor,
    "brand.secondaryColor": v.secondaryColor,
    "brand.accentColor": v.accentColor,
    "brand.fontFamily": v.fontFamily,
    "brand.website": v.website,
    "brand.description": v.description,
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
