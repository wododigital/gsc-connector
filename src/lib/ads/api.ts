/**
 * Google Ads API client (REST).
 *
 * Requires GOOGLE_ADS_DEVELOPER_TOKEN (basic access application pending as
 * of 2026-07). Until it is set, callers get a clear "pending approval"
 * error instead of a cryptic Google response. API version is env-tunable
 * because Google sunsets Ads API versions roughly yearly.
 */

import { AppError } from "../../types/index.js";

const ADS_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v21";
const ADS_BASE = `https://googleads.googleapis.com/${ADS_VERSION}`;

export class AdsApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Google Ads API error ${status}: ${body.slice(0, 200)}`);
    this.status = status;
    this.body = body;
    this.name = "AdsApiError";
  }

  userMessage(appUrl: string): string {
    if (this.status === 403 && this.body.includes("DEVELOPER_TOKEN")) {
      return "The Google Ads developer token is not yet approved for this access level. Please try again once Google approves the application.";
    }
    if (this.status === 403) {
      return `Access denied by Google Ads. Make sure your Google account has access to this Ads account, and that Ads is connected: ${appUrl}/dashboard.`;
    }
    if (this.status === 401) {
      return "Authentication expired. Please reconnect Google Ads from the dashboard.";
    }
    if (this.status === 429) {
      return "Google Ads API rate limit reached. Please wait a moment and try again.";
    }
    if (this.status >= 500) {
      return "The Google Ads API is temporarily unavailable. Please try again in a minute.";
    }
    return `Google Ads API error (${this.status}). Please try again.`;
  }
}

function requireDeveloperToken(): string {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!token) {
    throw new AppError(
      "PLATFORM_ACCESS_DENIED",
      "Google Ads integration is awaiting API access approval from Google. This tool will work as soon as the developer token is issued.",
      503
    );
  }
  return token;
}

function adsHeaders(accessToken: string, loginCustomerId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": requireDeveloperToken(),
    "Content-Type": "application/json",
  };
  if (loginCustomerId) {
    headers["login-customer-id"] = loginCustomerId.replace(/-/g, "");
  }
  return headers;
}

/** List customer resource names the authenticated user can access. */
export async function listAccessibleCustomers(accessToken: string): Promise<string[]> {
  const res = await fetch(`${ADS_BASE}/customers:listAccessibleCustomers`, {
    headers: adsHeaders(accessToken),
  });
  if (!res.ok) throw new AdsApiError(res.status, await res.text());
  const data = (await res.json()) as { resourceNames?: string[] };
  return data.resourceNames ?? [];
}

export interface AdsSearchRow {
  [key: string]: unknown;
}

/**
 * Run a GAQL query via googleAds:search (paged REST endpoint).
 * customerId: digits only or with dashes; loginCustomerId for MCC access.
 */
export async function adsSearch(
  accessToken: string,
  customerId: string,
  query: string,
  loginCustomerId?: string
): Promise<AdsSearchRow[]> {
  const cid = customerId.replace(/-/g, "");
  const res = await fetch(`${ADS_BASE}/customers/${cid}/googleAds:search`, {
    method: "POST",
    headers: adsHeaders(accessToken, loginCustomerId),
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new AdsApiError(res.status, await res.text());
  const data = (await res.json()) as { results?: AdsSearchRow[] };
  return data.results ?? [];
}
