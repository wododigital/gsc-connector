/**
 * Brand profile injector.
 * Replaces {{brand.*}} placeholders in prompt bodies with the user's brand
 * values, falling back to OMG Bridge defaults when no approved profile exists.
 *
 * Used by:
 *   - User-facing prompt copy flow (src/app/api/prompts/...)
 *   - MCP get_report_template tool
 */

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

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export const OMG_DEFAULTS: BrandValues = {
  companyName: "OMG Bridge",
  logoUrl: `${APP_URL}/OMG Rectangle LOGO Light BG.svg`,
  primaryColor: "#00B3B3",
  secondaryColor: "#0E1420",
  accentColor: "#6366F1",
  fontFamily: "Inter",
  website: "bridge.theomg.ai",
  description: "OMG Bridge connects Google Search Console, Analytics 4 and Business Profile to AI assistants via MCP.",
};

export function resolveBrandValues(brand: BrandProfileLike | null | undefined): BrandValues {
  if (!brand || !brand.isApproved) return OMG_DEFAULTS;

  return {
    companyName: brand.companyName?.trim() || OMG_DEFAULTS.companyName,
    logoUrl: brand.logoUrl?.trim() || OMG_DEFAULTS.logoUrl,
    primaryColor: brand.primaryColor?.trim() || OMG_DEFAULTS.primaryColor,
    secondaryColor: brand.secondaryColor?.trim() || OMG_DEFAULTS.secondaryColor,
    accentColor: brand.accentColor?.trim() || OMG_DEFAULTS.accentColor,
    fontFamily: brand.fontFamily?.trim() || OMG_DEFAULTS.fontFamily,
    website: brand.website?.trim() || OMG_DEFAULTS.website,
    description: brand.description?.trim() || OMG_DEFAULTS.description,
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
