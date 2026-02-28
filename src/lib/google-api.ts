/**
 * Google Search Console API Helper
 * 
 * Handles token refresh and API calls to GSC.
 * All tokens are stored encrypted in the database.
 */

// Google OAuth2 endpoints
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_API_BASE = "https://searchconsole.googleapis.com/webmasters/v3";
const GSC_SEARCH_ANALYTICS_URL = "https://searchconsole.googleapis.com/webmasters/v3/sites";
const URL_INSPECTION_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const MOBILE_TEST_URL = "https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run";

// Google OAuth scopes for GSC
export const GSC_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly", // Read-only GSC access
  "openid",
  "email",
  "profile",
];

// For write operations (add_site, delete_site, submit_sitemap, delete_sitemap)
export const GSC_WRITE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters", // Full GSC access
  "openid",
  "email",
  "profile",
];

/**
 * Refresh a Google access token using a stored refresh token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google token refresh failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Call the Search Analytics API
 * Endpoint: POST https://searchconsole.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query
 */
export async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  body: {
    startDate: string;
    endDate: string;
    dimensions?: string[];
    dimensionFilterGroups?: any[];
    rowLimit?: number;
    startRow?: number;
    type?: string; // "web", "image", "video", "news", "discover", "googleNews"
  }
) {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const url = `${GSC_SEARCH_ANALYTICS_URL}/${encodedSiteUrl}/searchAnalytics/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GSC Search Analytics API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Inspect a URL's indexing status
 * Endpoint: POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect
 */
export async function inspectUrl(
  accessToken: string,
  inspectionUrl: string,
  siteUrl: string
) {
  const response = await fetch(URL_INSPECTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspectionUrl, siteUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`URL Inspection API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * List all sitemaps for a site
 * Endpoint: GET https://searchconsole.googleapis.com/webmasters/v3/sites/{siteUrl}/sitemaps
 */
export async function listSitemaps(accessToken: string, siteUrl: string) {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const url = `${GSC_SEARCH_ANALYTICS_URL}/${encodedSiteUrl}/sitemaps`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Sitemaps API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Get a specific sitemap
 */
export async function getSitemap(accessToken: string, siteUrl: string, feedpath: string) {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedFeedpath = encodeURIComponent(feedpath);
  const url = `${GSC_SEARCH_ANALYTICS_URL}/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Get Sitemap API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Submit a sitemap
 */
export async function submitSitemap(accessToken: string, siteUrl: string, feedpath: string) {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedFeedpath = encodeURIComponent(feedpath);
  const url = `${GSC_SEARCH_ANALYTICS_URL}/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Submit Sitemap API error: ${JSON.stringify(error)}`);
  }

  // Returns empty body on success
  return { success: true };
}

/**
 * Delete a sitemap
 */
export async function deleteSitemap(accessToken: string, siteUrl: string, feedpath: string) {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedFeedpath = encodeURIComponent(feedpath);
  const url = `${GSC_SEARCH_ANALYTICS_URL}/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Delete Sitemap API error: ${JSON.stringify(error)}`);
  }

  return { success: true };
}

/**
 * List all sites
 * Endpoint: GET https://searchconsole.googleapis.com/webmasters/v3/sites
 */
export async function listSites(accessToken: string) {
  const url = `${GSC_API_BASE}/sites`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`List Sites API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Add a site
 */
export async function addSite(accessToken: string, siteUrl: string) {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const url = `${GSC_API_BASE}/sites/${encodedSiteUrl}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Add Site API error: ${JSON.stringify(error)}`);
  }

  return { success: true };
}

/**
 * Delete a site
 */
export async function deleteSite(accessToken: string, siteUrl: string) {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const url = `${GSC_API_BASE}/sites/${encodedSiteUrl}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Delete Site API error: ${JSON.stringify(error)}`);
  }

  return { success: true };
}

/**
 * Run mobile-friendly test
 * Endpoint: POST https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run
 * NOTE: This API uses an API key, not OAuth token
 */
export async function runMobileFriendlyTest(url: string) {
  const response = await fetch(
    `${MOBILE_TEST_URL}?key=${process.env.GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Mobile Friendly Test API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}
