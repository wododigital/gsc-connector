/**
 * GA4 API Client
 *
 * Wraps Google Analytics Data API (v1beta) and Admin API (v1beta).
 * Uses the same OAuth access token as GSC (same google_credentials record).
 *
 * Admin API base: https://analyticsadmin.googleapis.com/v1beta
 * Data API base:  https://analyticsdata.googleapis.com/v1beta
 */

import type {
  GA4AccountSummariesResponse,
  GA4PropertySummary,
  GA4RunReportRequest,
  GA4RunReportResponse,
  GA4RealtimeReportRequest,
  GA4FilterShorthand,
  GA4FilterExpression,
} from "./types.js";

const ADMIN_BASE = "https://analyticsadmin.googleapis.com/v1beta";
const DATA_BASE = "https://analyticsdata.googleapis.com/v1beta";

/** Numeric GA4 property ID extracted from "properties/987654321" */
export function extractPropertyNumericId(propertyId: string): string {
  return propertyId.replace(/^properties\//, "");
}

/** Common fetch wrapper with auth header */
async function ga4Fetch(
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

/**
 * List all GA4 properties via Admin API accountSummaries.
 * Paginates until all results are fetched.
 */
export async function listGA4Properties(
  accessToken: string
): Promise<GA4PropertySummary[]> {
  const properties: GA4PropertySummary[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${ADMIN_BASE}/accountSummaries`);
    url.searchParams.set("pageSize", "200");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await ga4Fetch(url.toString(), accessToken);

    if (!res.ok) {
      const body = await res.text();
      throw new GA4ApiError(res.status, body);
    }

    const data = (await res.json()) as GA4AccountSummariesResponse;

    for (const account of data.accountSummaries ?? []) {
      for (const prop of account.propertySummaries ?? []) {
        properties.push({
          property: prop.property,
          displayName: prop.displayName,
          propertyType: prop.propertyType,
          parent: account.account,
          // Store account display name for the UI
          // We add accountName as an extra field (non-standard)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(({ accountName: account.displayName } as any)),
        });
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return properties;
}

/** Run a standard GA4 Data API report */
export async function runGA4Report(
  accessToken: string,
  propertyId: string,
  body: GA4RunReportRequest
): Promise<GA4RunReportResponse> {
  const numericId = extractPropertyNumericId(propertyId);
  const url = `${DATA_BASE}/properties/${numericId}:runReport`;

  const res = await ga4Fetch(url, accessToken, {
    method: "POST",
    body: JSON.stringify({ ...body, returnPropertyQuota: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new GA4ApiError(res.status, text);
  }

  return res.json() as Promise<GA4RunReportResponse>;
}

/** Run a GA4 Realtime report */
export async function runGA4RealtimeReport(
  accessToken: string,
  propertyId: string,
  body: GA4RealtimeReportRequest
): Promise<GA4RunReportResponse> {
  const numericId = extractPropertyNumericId(propertyId);
  const url = `${DATA_BASE}/properties/${numericId}:runRealtimeReport`;

  const res = await ga4Fetch(url, accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new GA4ApiError(res.status, text);
  }

  return res.json() as Promise<GA4RunReportResponse>;
}

/**
 * Convert simplified filter shorthand to GA4 FilterExpression.
 * Input: {fieldName: "pagePath", matchType: "CONTAINS", value: "/blog/"}
 * Output: proper GA4 FilterExpression object
 */
export function buildFilterExpression(
  input: GA4FilterShorthand | GA4FilterExpression | undefined
): GA4FilterExpression | undefined {
  if (!input) return undefined;

  // If it already looks like a proper FilterExpression (has andGroup/orGroup/notExpression)
  if ("andGroup" in input || "orGroup" in input || "notExpression" in input) {
    return input as GA4FilterExpression;
  }

  // If it's a shorthand with fieldName
  if ("fieldName" in input) {
    const shorthand = input as GA4FilterShorthand;

    // inListFilter shorthand
    if (shorthand.values && shorthand.values.length > 0) {
      return {
        filter: {
          fieldName: shorthand.fieldName,
          inListFilter: {
            values: shorthand.values,
            caseSensitive: false,
          },
        },
      };
    }

    // stringFilter shorthand
    if (shorthand.value !== undefined) {
      return {
        filter: {
          fieldName: shorthand.fieldName,
          stringFilter: {
            matchType: shorthand.matchType ?? "EXACT",
            value: shorthand.value,
          },
        },
      };
    }
  }

  // Full FilterExpression passed as-is
  if ("filter" in input) {
    return input as GA4FilterExpression;
  }

  return undefined;
}

/**
 * Parse GA4 runReport response into a readable array of objects.
 */
export function parseGA4Response(
  response: GA4RunReportResponse
): Array<Record<string, string>> {
  const dimHeaders = (response.dimensionHeaders ?? []).map((h) => h.name);
  const metHeaders = (response.metricHeaders ?? []).map((h) => h.name);

  return (response.rows ?? []).map((row) => {
    const obj: Record<string, string> = {};
    (row.dimensionValues ?? []).forEach((v, i) => {
      obj[dimHeaders[i] ?? `dim${i}`] = v.value;
    });
    (row.metricValues ?? []).forEach((v, i) => {
      obj[metHeaders[i] ?? `metric${i}`] = v.value;
    });
    return obj;
  });
}

/**
 * GA4 API error with HTTP status code for proper error handling.
 */
export class GA4ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string
  ) {
    super(`GA4 API error ${status}: ${body.slice(0, 200)}`);
    this.name = "GA4ApiError";
  }

  /** Check if this is a scope/permission error */
  isInsufficientScope(): boolean {
    return (
      this.status === 403 &&
      (this.body.includes("insufficient authentication scopes") ||
        this.body.includes("PERMISSION_DENIED"))
    );
  }

  /** Check if rate limited */
  isRateLimited(): boolean {
    return this.status === 429;
  }

  /** User-friendly error message */
  userMessage(appUrl: string): string {
    if (this.isInsufficientScope()) {
      return `Please reconnect your Google account to enable Analytics access. Go to ${appUrl}/dashboard and click "Connect another Google account".`;
    }
    if (this.isRateLimited()) {
      return "GA4 API rate limit reached. Please wait a moment and try again.";
    }
    if (this.status === 401) {
      return "Authentication expired. Please reconnect your Google account.";
    }
    if (this.status === 400) {
      return `Invalid dimension or metric name. Check that all dimension/metric names are valid GA4 names.`;
    }
    if (this.status >= 500) {
      return "Google Analytics API is temporarily unavailable. Please try again in a minute.";
    }
    return `GA4 API error (${this.status}). Please try again.`;
  }
}
