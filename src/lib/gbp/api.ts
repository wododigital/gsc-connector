/**
 * GBP API Client
 *
 * Wraps Google Business Profile APIs.
 * Uses the same OAuth access token as GSC/GA4 (same google_credentials record).
 *
 * Account Mgmt:  https://mybusinessaccountmanagement.googleapis.com/v1
 * Business Info: https://mybusinessbusinessinformation.googleapis.com/v1
 * Performance:   https://businessprofileperformance.googleapis.com/v1
 * Legacy v4:     https://mybusiness.googleapis.com/v4  (reviews, posts, media)
 */

const ACCOUNT_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";
const BIZINFO_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const PERF_BASE = "https://businessprofileperformance.googleapis.com/v1";
const LEGACY_BASE = "https://mybusiness.googleapis.com/v4";

/** Common fetch wrapper with auth header */
async function gbpFetch(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

async function gbpGet<T>(url: string, accessToken: string): Promise<T> {
  const res = await gbpFetch(url, accessToken);
  if (!res.ok) {
    const text = await res.text();
    throw new GbpApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

/**
 * GBP API error with HTTP status for proper handling.
 */
export class GbpApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string
  ) {
    super(`GBP API error ${status}: ${body.slice(0, 200)}`);
    this.name = "GbpApiError";
  }

  isInsufficientScope(): boolean {
    return (
      this.status === 403 &&
      (this.body.includes("insufficient") ||
        this.body.includes("PERMISSION_DENIED") ||
        this.body.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT"))
    );
  }

  isRateLimited(): boolean {
    return this.status === 429;
  }

  userMessage(appUrl: string): string {
    if (this.isInsufficientScope()) {
      return `Please reconnect your Google account to enable Business Profile access. Go to ${appUrl}/dashboard and click "Reconnect Google Account".`;
    }
    if (this.isRateLimited()) {
      return "GBP API rate limit reached. Please wait a moment and try again.";
    }
    if (this.status === 401) {
      return "Authentication expired. Please reconnect your Google account.";
    }
    if (this.status === 404) {
      return "Location not found. Please check the location name and try again.";
    }
    if (this.status >= 500) {
      return "Google Business Profile API is temporarily unavailable. Please try again in a minute.";
    }
    return `GBP API error (${this.status}). Please try again.`;
  }
}

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface GbpAccount {
  name: string;        // "accounts/{accountId}"
  accountName: string; // display name
  type: string;
  verificationState?: string;
  vettedState?: string;
}

export interface GbpLocation {
  name: string;        // "locations/{locationId}"
  title: string;
  websiteUri?: string;
  phoneNumbers?: {
    primaryPhone?: string;
    additionalPhones?: string[];
  };
  categories?: {
    primaryCategory?: { displayName: string };
  };
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    regionCode?: string;
  };
  regularHours?: {
    periods?: Array<{
      openDay: string;
      closeDay: string;
      openTime?: { hours: number; minutes?: number };
      closeTime?: { hours: number; minutes?: number };
    }>;
  };
}

export interface GbpReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: string;
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

// ----------------------------------------------------------------
// API functions
// ----------------------------------------------------------------

/**
 * List all GBP accounts for the authenticated user.
 */
export async function listGbpAccounts(
  accessToken: string
): Promise<GbpAccount[]> {
  const data = await gbpGet<{ accounts?: GbpAccount[] }>(
    `${ACCOUNT_BASE}/accounts`,
    accessToken
  );
  return data.accounts ?? [];
}

/**
 * List locations under a GBP account.
 * accountName: "accounts/{accountId}"
 */
export async function listGbpLocations(
  accessToken: string,
  accountName: string
): Promise<GbpLocation[]> {
  const url = new URL(`${BIZINFO_BASE}/${accountName}/locations`);
  url.searchParams.set("pageSize", "100");
  url.searchParams.set(
    "readMask",
    "name,title,websiteUri,phoneNumbers,categories,storefrontAddress,regularHours"
  );

  const data = await gbpGet<{ locations?: GbpLocation[]; nextPageToken?: string }>(
    url.toString(),
    accessToken
  );
  return data.locations ?? [];
}

/**
 * Get reviews for a location.
 * locationPath: "accounts/{accountId}/locations/{locationId}"
 */
export async function getGbpReviews(
  accessToken: string,
  locationPath: string,
  pageSize = 20
): Promise<{
  reviews: GbpReview[];
  totalReviewCount: number;
  averageRating: number;
}> {
  const url = new URL(`${LEGACY_BASE}/${locationPath}/reviews`);
  url.searchParams.set("pageSize", String(Math.min(pageSize, 50)));
  url.searchParams.set("orderBy", "updateTime desc");

  const data = await gbpGet<{
    reviews?: GbpReview[];
    totalReviewCount?: number;
    averageRating?: number;
  }>(url.toString(), accessToken);

  return {
    reviews: data.reviews ?? [],
    totalReviewCount: data.totalReviewCount ?? 0,
    averageRating: data.averageRating ?? 0,
  };
}

/**
 * Get daily performance metrics for a location.
 * locationPath: "accounts/{accountId}/locations/{locationId}" or "locations/{locationId}"
 */
export async function getGbpPerformance(
  accessToken: string,
  locationPath: string,
  startDate: string,
  endDate: string
): Promise<Record<string, unknown>> {
  // Performance API uses "locations/{locationId}" format
  const locPart = extractLocationsSegment(locationPath);
  const url = `${PERF_BASE}/${locPart}:fetchMultiDailyMetricsTimeSeries`;

  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);

  const body = {
    dailyMetrics: [
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
      "BUSINESS_DIRECTION_REQUESTS",
      "CALL_CLICKS",
      "WEBSITE_CLICKS",
    ],
    timeRange: {
      startDate: { year: sy, month: sm, day: sd },
      endDate: { year: ey, month: em, day: ed },
    },
  };

  const res = await gbpFetch(url, accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new GbpApiError(res.status, text);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

/**
 * Get monthly search keywords driving impressions.
 * locationPath: "accounts/{accountId}/locations/{locationId}" or "locations/{locationId}"
 */
export async function getGbpSearchKeywords(
  accessToken: string,
  locationPath: string
): Promise<Record<string, unknown>> {
  const locPart = extractLocationsSegment(locationPath);
  const url = `${PERF_BASE}/${locPart}/searchkeywords/impressions/monthly`;
  return gbpGet<Record<string, unknown>>(url, accessToken);
}

/**
 * Get local posts for a location.
 * locationPath: "accounts/{accountId}/locations/{locationId}"
 */
export async function getGbpPosts(
  accessToken: string,
  locationPath: string,
  pageSize = 10
): Promise<Record<string, unknown>[]> {
  const url = new URL(`${LEGACY_BASE}/${locationPath}/localPosts`);
  url.searchParams.set("pageSize", String(Math.min(pageSize, 20)));

  const data = await gbpGet<{ localPosts?: Record<string, unknown>[] }>(
    url.toString(),
    accessToken
  );
  return data.localPosts ?? [];
}

/**
 * Get media items for a location.
 * locationPath: "accounts/{accountId}/locations/{locationId}"
 */
export async function getGbpMedia(
  accessToken: string,
  locationPath: string,
  pageSize = 10
): Promise<Record<string, unknown>[]> {
  const url = new URL(`${LEGACY_BASE}/${locationPath}/media`);
  url.searchParams.set("pageSize", String(Math.min(pageSize, 20)));

  const data = await gbpGet<{ mediaItems?: Record<string, unknown>[] }>(
    url.toString(),
    accessToken
  );
  return data.mediaItems ?? [];
}

/**
 * Extract the "locations/{locationId}" segment from a full path.
 * "accounts/123/locations/456" -> "locations/456"
 * "locations/456" -> "locations/456"
 */
function extractLocationsSegment(locationPath: string): string {
  const match = locationPath.match(/(locations\/[^/]+)$/);
  return match ? match[1] : locationPath;
}
