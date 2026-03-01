/**
 * GA4 Property Resolver
 *
 * Fuzzy matching for GA4 property IDs and display names.
 * Similar to resolveSiteUrl() for GSC but adapted for GA4's numeric ID format.
 *
 * GA4 property IDs look like: "properties/987654321"
 * Display names look like:   "nandhini.com", "My Website"
 *
 * Match order:
 *   1. Exact property_id match ("properties/987654321" or "987654321")
 *   2. Display name exact match (case-insensitive)
 *   3. Display name partial match
 *   4. Single active property - use it automatically
 */

import db from "../db.js";

export interface GA4PropertyRecord {
  propertyId: string;
  displayName: string;
  accountName: string | null;
}

export type GA4ResolveResult =
  | { resolved: GA4PropertyRecord }
  | { notFound: true; available: GA4PropertyRecord[]; message: string };

/**
 * Resolve user input to an active GA4 property for the given user.
 * Returns the full property record (propertyId + displayName).
 */
export async function resolveGA4Property(
  userInput: string,
  userId: string
): Promise<GA4ResolveResult> {
  const properties = await db.ga4Property.findMany({
    where: { userId, isActive: true },
    select: { propertyId: true, displayName: true, accountName: true },
    orderBy: { createdAt: "asc" },
  });

  if (properties.length === 0) {
    return {
      notFound: true,
      available: [],
      message:
        "No active GA4 properties found. Please connect your Google account and select GA4 properties in the consent screen.",
    };
  }

  const input = userInput.trim();
  const inputLower = input.toLowerCase();

  // 1. Exact property_id match - "properties/987654321" or just "987654321"
  const exactId = properties.find(
    (p) =>
      p.propertyId === input ||
      p.propertyId === `properties/${input}` ||
      p.propertyId.replace("properties/", "") === input
  );
  if (exactId) return { resolved: exactId };

  // 2. Display name exact match (case-insensitive)
  const exactName = properties.find(
    (p) => p.displayName.toLowerCase() === inputLower
  );
  if (exactName) return { resolved: exactName };

  // 3. Display name partial match
  const partialMatches = properties.filter((p) => {
    const nameLower = p.displayName.toLowerCase();
    // Strip TLD for matching: "nandhini.com" -> "nandhini"
    const nameWithoutTld = nameLower.replace(/\.[a-z]{2,}$/, "");
    return (
      nameLower.includes(inputLower) ||
      inputLower.includes(nameLower) ||
      nameWithoutTld.includes(inputLower) ||
      inputLower.includes(nameWithoutTld)
    );
  });

  if (partialMatches.length === 1) return { resolved: partialMatches[0] };

  if (partialMatches.length > 1) {
    const list = partialMatches
      .map((p) => `${p.displayName} (${p.propertyId})`)
      .join(", ");
    return {
      notFound: true,
      available: partialMatches,
      message: `Multiple GA4 properties match "${userInput}". Please be more specific: ${list}.`,
    };
  }

  // 4. Only one active property - use it automatically
  if (properties.length === 1) return { resolved: properties[0] };

  // No match
  const list = properties
    .map((p) => `${p.displayName} (${p.propertyId})`)
    .join(", ");
  return {
    notFound: true,
    available: properties,
    message: `Could not find GA4 property matching "${userInput}". Available properties: ${list}. Use ga_list_properties to see all options.`,
  };
}
