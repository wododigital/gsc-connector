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
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`GBP API error ${status}: ${body.slice(0, 200)}`);
    this.status = status;
    this.body = body;
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

export interface GbpAccount {
  name: string;
  accountName: string;
  type: string;
  verificationState?: string;
  vettedState?: string;
}

export interface GbpLocation {
  name: string;
  title: string;
  websiteUri?: string;
  phoneNumbers?: {
    primaryPhone?: string;
    additionalPhones?: string[];
  };
  categories?: {
    primaryCategory?: {
      displayName: string;
    };
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
      openTime?: {
        hours: number;
        minutes?: number;
      };
      closeTime?: {
        hours: number;
        minutes?: number;
      };
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

export interface GbpLocalPost {
  name: string;
  topicType?: string;
  state?: string;
  summary?: string;
  callToAction?: {
    actionType?: string;
    url?: string;
  };
  event?: {
    title?: string;
    schedule?: unknown;
  };
  offer?: {
    couponCode?: string;
    redeemOnlineUrl?: string;
    termsConditions?: string;
  };
  media?: Array<{
    name?: string;
    mediaFormat?: string;
    googleUrl?: string;
  }>;
  createTime?: string;
  updateTime?: string;
}

export interface GbpMediaItem {
  name: string;
  mediaFormat?: string;
  googleUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  createTime?: string;
  locationAssociation?: {
    category?: string;
  };
  insights?: {
    viewCount?: string;
  };
  attribution?: {
    profileName?: string;
  };
}

export interface GbpDatedValue {
  date: { year: number; month: number; day: number };
  value?: string;
}

export interface GbpPerformanceData {
  multiDailyMetricTimeSeries?: Array<{
    dailyMetricTimeSeries?: Array<{
      dailyMetric?: string;
      timeSeries?: {
        datedValues?: GbpDatedValue[];
      };
    }>;
  }>;
}

export interface GbpSearchKeywordsResponse {
  searchKeywordsCounts?: Array<{
    searchKeyword?: string;
    insightsValue?: {
      value?: string;
      threshold?: string;
    };
  }>;
  nextPageToken?: string;
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
  const data = await gbpGet<{ locations?: GbpLocation[] }>(
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
  pageSize: number = 20
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

const DEFAULT_DAILY_METRICS = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "BUSINESS_DIRECTION_REQUESTS",
  "CALL_CLICKS",
  "WEBSITE_CLICKS",
] as const;

/**
 * Get daily performance metrics for a location.
 *
 * NOTE: The Business Profile Performance API expects a GET (not POST) with
 * query parameters, and the date-range field is `dailyRange` (with snake_case
 * `start_date`/`end_date`) - not `timeRange`. Sending POST or `timeRange`
 * silently routes to 404 / Location not found.
 * Path is bare `locations/{id}` - no `accounts/...` prefix.
 *
 * locationPath: "accounts/{accountId}/locations/{locationId}" or "locations/{locationId}"
 */
export async function getGbpPerformance(
  accessToken: string,
  locationPath: string,
  startDate: string,
  endDate: string
): Promise<GbpPerformanceData> {
  const locPart = extractLocationsSegment(locationPath);
  const url = new URL(`${PERF_BASE}/${locPart}:fetchMultiDailyMetricsTimeSeries`);
  for (const metric of DEFAULT_DAILY_METRICS) {
    url.searchParams.append("dailyMetrics", metric);
  }
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  url.searchParams.set("dailyRange.start_date.year", String(sy));
  url.searchParams.set("dailyRange.start_date.month", String(sm));
  url.searchParams.set("dailyRange.start_date.day", String(sd));
  url.searchParams.set("dailyRange.end_date.year", String(ey));
  url.searchParams.set("dailyRange.end_date.month", String(em));
  url.searchParams.set("dailyRange.end_date.day", String(ed));
  return gbpGet<GbpPerformanceData>(url.toString(), accessToken);
}

/**
 * Get monthly search keywords driving impressions.
 *
 * NOTE: monthlyRange.{startMonth,endMonth}.{year,month} are all REQUIRED.
 * Omitting them yields a generic 400. Field names here are camelCase
 * (different from `dailyRange` snake_case in fetchMultiDailyMetricsTimeSeries).
 *
 * locationPath: "accounts/{accountId}/locations/{locationId}" or "locations/{locationId}"
 */
export async function getGbpSearchKeywords(
  accessToken: string,
  locationPath: string,
  startMonth: { year: number; month: number },
  endMonth: { year: number; month: number }
): Promise<GbpSearchKeywordsResponse> {
  const locPart = extractLocationsSegment(locationPath);
  const url = new URL(`${PERF_BASE}/${locPart}/searchkeywords/impressions/monthly`);
  url.searchParams.set("monthlyRange.startMonth.year", String(startMonth.year));
  url.searchParams.set("monthlyRange.startMonth.month", String(startMonth.month));
  url.searchParams.set("monthlyRange.endMonth.year", String(endMonth.year));
  url.searchParams.set("monthlyRange.endMonth.month", String(endMonth.month));
  return gbpGet<GbpSearchKeywordsResponse>(url.toString(), accessToken);
}

/**
 * Get local posts for a location.
 * locationPath: "accounts/{accountId}/locations/{locationId}"
 */
export async function getGbpPosts(
  accessToken: string,
  locationPath: string,
  pageSize: number = 10
): Promise<GbpLocalPost[]> {
  const url = new URL(`${LEGACY_BASE}/${locationPath}/localPosts`);
  url.searchParams.set("pageSize", String(Math.min(pageSize, 20)));
  const data = await gbpGet<{ localPosts?: GbpLocalPost[] }>(
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
  pageSize: number = 10
): Promise<GbpMediaItem[]> {
  const url = new URL(`${LEGACY_BASE}/${locationPath}/media`);
  url.searchParams.set("pageSize", String(Math.min(pageSize, 20)));
  const data = await gbpGet<{ mediaItems?: GbpMediaItem[] }>(
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
