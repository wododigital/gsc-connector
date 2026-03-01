/**
 * Fuzzy Site URL Resolver
 *
 * Matches a user-supplied string against a list of active GSC property URLs
 * using progressively looser matching rules.
 *
 * Matching order:
 *   1. Exact match
 *   2. Case-insensitive exact match
 *   3. Normalized match (strip protocol + trailing slash)
 *   4. Substring match (e.g. "nandhini" matches "https://nandhini.com/")
 *   5. No match - return available list
 */

export interface SiteUrlOption {
  siteUrl: string;
}

export type ResolveResult =
  | { resolved: string }
  | { ambiguous: string[]; message: string }
  | { notFound: true; available: string[]; message: string };

/**
 * Strip protocol and trailing slash for comparison.
 * "https://nandhini.com/" -> "nandhini.com"
 */
function normalize(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

/**
 * Returns a human-readable short label for display.
 * "https://nandhini.com/" -> "nandhini.com"
 */
export function shortLabel(siteUrl: string): string {
  return normalize(siteUrl);
}

/**
 * Resolve user input to a canonical active property URL.
 *
 * @param input - What the user typed (could be partial, no protocol, etc.)
 * @param properties - Active properties to match against
 */
export function resolveSiteUrl(
  input: string,
  properties: SiteUrlOption[]
): ResolveResult {
  if (!input || properties.length === 0) {
    const available = properties.map((p) => p.siteUrl);
    return {
      notFound: true,
      available,
      message: `No input provided. Active properties: ${available.join(", ")}`,
    };
  }

  const urls = properties.map((p) => p.siteUrl);
  const normInput = normalize(input);

  // 1. Exact match
  const exact = urls.find((u) => u === input);
  if (exact) return { resolved: exact };

  // 2. Case-insensitive exact match
  const ci = urls.find((u) => u.toLowerCase() === input.toLowerCase());
  if (ci) return { resolved: ci };

  // 3. Normalized match (strip protocol + trailing slash)
  const normMatches = urls.filter((u) => normalize(u) === normInput);
  if (normMatches.length === 1) return { resolved: normMatches[0] };
  if (normMatches.length > 1) {
    return {
      ambiguous: normMatches,
      message: `Multiple properties match "${input}". Please specify one: ${normMatches.join(", ")}`,
    };
  }

  // 4. Substring match
  const subMatches = urls.filter(
    (u) =>
      normalize(u).includes(normInput) || normInput.includes(normalize(u))
  );
  if (subMatches.length === 1) return { resolved: subMatches[0] };
  if (subMatches.length > 1) {
    return {
      ambiguous: subMatches,
      message: `Multiple properties match "${input}". Please specify one: ${subMatches.join(", ")}`,
    };
  }

  // No match
  return {
    notFound: true,
    available: urls,
    message: `No active property matches "${input}". Active properties: ${urls.join(", ")}. Use list_my_properties to see all.`,
  };
}
