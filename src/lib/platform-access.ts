/**
 * Per-user platform entitlements (admin-granted).
 *
 * Gates the premium platform integrations - Google Ads and Tag Manager -
 * at three levels:
 *   1. Dashboard: connect buttons only render for entitled users.
 *   2. Connect routes: /api/{ads,gtm}/connect reject non-entitled users.
 *   3. MCP: ads and gtm tools are only registered for entitled users'
 *      sessions, and re-checked at call time (sessions outlive grants).
 */

import db from "./db.js";

export const GATED_PLATFORMS = ["google_ads", "gtm"] as const;
export type GatedPlatform = (typeof GATED_PLATFORMS)[number];

export function isGatedPlatform(value: string): value is GatedPlatform {
  return (GATED_PLATFORMS as readonly string[]).includes(value);
}

/** True when the user has an enabled entitlement for the platform. */
export async function hasPlatformAccess(
  userId: string,
  platform: GatedPlatform
): Promise<boolean> {
  const row = await db.platformAccess.findUnique({
    where: { userId_platform: { userId, platform } },
    select: { enabled: true },
  });
  return row?.enabled === true;
}

/** Entitlement map for a user, e.g. { google_ads: false, gtm: true }. */
export async function getPlatformAccessMap(
  userId: string
): Promise<Record<GatedPlatform, boolean>> {
  const rows = await db.platformAccess.findMany({
    where: { userId },
    select: { platform: true, enabled: true },
  });
  const map = Object.fromEntries(
    GATED_PLATFORMS.map((p) => [p, false])
  ) as Record<GatedPlatform, boolean>;
  for (const row of rows) {
    if (isGatedPlatform(row.platform)) map[row.platform] = row.enabled;
  }
  return map;
}

/** Grant or revoke a platform for a user (admin action). */
export async function setPlatformAccess(
  userId: string,
  platform: GatedPlatform,
  enabled: boolean,
  grantedBy: string
): Promise<void> {
  await db.platformAccess.upsert({
    where: { userId_platform: { userId, platform } },
    update: { enabled, grantedBy },
    create: { userId, platform, enabled, grantedBy },
  });
}
