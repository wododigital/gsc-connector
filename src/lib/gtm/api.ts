/**
 * Google Tag Manager API v2 client.
 *
 * QUOTA WARNING: the GTM API defaults to ~15 requests/minute per GCP
 * project (shared across ALL users). Every read goes through a process-wide
 * cache (container config changes rarely - 1h TTL) and a minimum-interval
 * throttle so audit workloads survive the default quota.
 */

const GTM_BASE = "https://tagmanager.googleapis.com/tagmanager/v2";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_REQUEST_INTERVAL_MS = 4_500; // ~13/min, under the 15/min default quota

export class GtmApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`GTM API error ${status}: ${body.slice(0, 200)}`);
    this.status = status;
    this.body = body;
    this.name = "GtmApiError";
  }

  isRateLimited(): boolean {
    return this.status === 429;
  }

  isInsufficientScope(): boolean {
    return (
      this.status === 403 &&
      (this.body.includes("insufficient") ||
        this.body.includes("PERMISSION_DENIED") ||
        this.body.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT"))
    );
  }

  userMessage(appUrl: string): string {
    if (this.isInsufficientScope()) {
      return `Please connect Tag Manager access: go to ${appUrl}/dashboard and click Connect on the Tag Manager card.`;
    }
    if (this.isRateLimited()) {
      return "Tag Manager API rate limit reached (Google's default quota is very low). Please wait a minute and try again.";
    }
    if (this.status === 401) {
      return "Authentication expired. Please reconnect your Google account.";
    }
    if (this.status === 404) {
      return "GTM account/container not found. Check the path and try gtm_list_accounts first.";
    }
    if (this.status >= 500) {
      return "The Tag Manager API is temporarily unavailable. Please try again in a minute.";
    }
    return `Tag Manager API error (${this.status}). Please try again.`;
  }
}

// ----------------------------------------------------------------
// Process-wide cache + throttle
// ----------------------------------------------------------------

const cache = new Map<string, { data: unknown; expiresAt: number }>();
let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function throttledGtmGet<T>(url: string, accessToken: string): Promise<T> {
  // Cache key includes a token-owner discriminator: the same URL under two
  // different users' tokens can return different data (permissions), so we
  // hash a short prefix of the token into the key.
  const cacheKey = `${accessToken.slice(0, 16)}:${url}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new GtmApiError(res.status, await res.text());
  }

  const data = (await res.json()) as T;
  cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });

  // Opportunistic cleanup so the cache cannot grow unbounded
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (v.expiresAt < now) cache.delete(k);
    }
  }

  return data;
}

/** Drop cached entries (used after write operations, when those land). */
export function invalidateGtmCache(): void {
  cache.clear();
}

// ----------------------------------------------------------------
// Types (subset of GTM API v2 resources)
// ----------------------------------------------------------------

export interface GtmAccount {
  path: string; // "accounts/123"
  accountId: string;
  name: string;
}

export interface GtmContainer {
  path: string; // "accounts/123/containers/456"
  containerId: string;
  name: string;
  publicId: string; // "GTM-XXXXXX"
  usageContext?: string[];
}

export interface GtmWorkspace {
  path: string; // ".../workspaces/789"
  workspaceId: string;
  name: string;
}

export interface GtmTag {
  path: string;
  tagId: string;
  name: string;
  type: string;
  paused?: boolean;
  firingTriggerId?: string[];
  blockingTriggerId?: string[];
  parameter?: Array<{ key?: string; value?: string; type?: string }>;
}

export interface GtmTrigger {
  path: string;
  triggerId: string;
  name: string;
  type: string;
}

export interface GtmVariable {
  path: string;
  variableId: string;
  name: string;
  type: string;
}

// ----------------------------------------------------------------
// API functions
// ----------------------------------------------------------------

export async function listGtmAccounts(accessToken: string): Promise<GtmAccount[]> {
  const data = await throttledGtmGet<{ account?: GtmAccount[] }>(
    `${GTM_BASE}/accounts`,
    accessToken
  );
  return data.account ?? [];
}

/** accountPath: "accounts/{accountId}" */
export async function listGtmContainers(
  accessToken: string,
  accountPath: string
): Promise<GtmContainer[]> {
  const data = await throttledGtmGet<{ container?: GtmContainer[] }>(
    `${GTM_BASE}/${accountPath}/containers`,
    accessToken
  );
  return data.container ?? [];
}

/** containerPath: "accounts/{aid}/containers/{cid}" */
export async function listGtmWorkspaces(
  accessToken: string,
  containerPath: string
): Promise<GtmWorkspace[]> {
  const data = await throttledGtmGet<{ workspace?: GtmWorkspace[] }>(
    `${GTM_BASE}/${containerPath}/workspaces`,
    accessToken
  );
  return data.workspace ?? [];
}

/** workspacePath: "accounts/{aid}/containers/{cid}/workspaces/{wid}" */
export async function listGtmTags(
  accessToken: string,
  workspacePath: string
): Promise<GtmTag[]> {
  const data = await throttledGtmGet<{ tag?: GtmTag[] }>(
    `${GTM_BASE}/${workspacePath}/tags`,
    accessToken
  );
  return data.tag ?? [];
}

export async function listGtmTriggers(
  accessToken: string,
  workspacePath: string
): Promise<GtmTrigger[]> {
  const data = await throttledGtmGet<{ trigger?: GtmTrigger[] }>(
    `${GTM_BASE}/${workspacePath}/triggers`,
    accessToken
  );
  return data.trigger ?? [];
}

export async function listGtmVariables(
  accessToken: string,
  workspacePath: string
): Promise<GtmVariable[]> {
  const data = await throttledGtmGet<{ variable?: GtmVariable[] }>(
    `${GTM_BASE}/${workspacePath}/variables`,
    accessToken
  );
  return data.variable ?? [];
}

/**
 * Resolve the default workspace for a container (GTM always has at least
 * one; the first listed is the default for read purposes).
 */
export async function getDefaultWorkspacePath(
  accessToken: string,
  containerPath: string
): Promise<string> {
  const workspaces = await listGtmWorkspaces(accessToken, containerPath);
  if (workspaces.length === 0) {
    throw new GtmApiError(404, "No workspaces found in container");
  }
  const def = workspaces.find((w) => w.name === "Default Workspace") ?? workspaces[0];
  return def.path;
}
