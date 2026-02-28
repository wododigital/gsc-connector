/**
 * GSC Connect - Shared TypeScript Interfaces
 * Owned by: Architect agent
 */

// ============================================================
// Domain Types
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  googleId: string | null;
  passwordHash: string | null;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionTier = "free" | "pro" | "agency";

export interface GoogleCredential {
  id: string;
  userId: string;
  googleEmail: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiry: Date;
  scopes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GscProperty {
  id: string;
  userId: string;
  credentialId: string;
  siteUrl: string;
  permissionLevel: GscPermissionLevel;
  isActive: boolean;
  createdAt: Date;
}

export type GscPermissionLevel =
  | "siteOwner"
  | "siteFullUser"
  | "siteRestrictedUser"
  | "siteUnverifiedUser";

export interface ApiKey {
  id: string;
  userId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface OAuthClient {
  id: string;
  clientId: string;
  clientSecretHash: string;
  clientName: string;
  redirectUris: string[];
  grantTypes: string[];
  tokenEndpointAuthMethod: string;
  createdAt: Date;
}

export interface OAuthToken {
  id: string;
  userId: string;
  clientId: string;
  accessTokenHash: string;
  refreshTokenHash: string | null;
  propertyId: string;
  scopes: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface OAuthAuthorizationCode {
  id: string;
  codeHash: string;
  userId: string;
  clientId: string;
  redirectUri: string;
  propertyId: string;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
  scopes: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface UsageLog {
  id: string;
  userId: string;
  toolName: string;
  siteUrl: string;
  source: string;
  createdAt: Date;
}

// ============================================================
// MCP Tool Types
// ============================================================

export interface MCPToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

export interface MCPSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface MCPErrorResponse {
  success: false;
  error: string;
}

// ============================================================
// GSC API Types
// ============================================================

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface SitemapEntry {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  type?: string;
  lastDownloaded?: string;
  warnings?: number;
  errors?: number;
  contents?: Array<{ type: string; submitted: number; indexed: number }>;
}

export interface SiteEntry {
  siteUrl: string;
  permissionLevel: GscPermissionLevel;
}

export interface UrlInspectionResult {
  inspectionResultLink?: string;
  indexStatusResult?: {
    verdict: string;
    coverageState: string;
    robotsTxtState: string;
    indexingState: string;
    lastCrawlTime?: string;
    pageFetchState: string;
    googleCanonical?: string;
    userCanonical?: string;
    sitemap?: string[];
    referringUrls?: string[];
    crawledAs?: string;
  };
  mobileUsabilityResult?: {
    verdict: string;
    issues?: Array<{ issueType: string; severity: string; message: string }>;
  };
  richResultsResult?: {
    verdict: string;
    detectedItems?: Array<{ richResultType: string; items: unknown[] }>;
  };
}

export interface MobileFriendlyTestResult {
  testStatus: {
    status: string;
    details?: string;
  };
  mobileFriendliness?: string;
  mobileFriendlyIssues?: Array<{ rule: string }>;
  resourceIssues?: Array<{
    blockedResource: { url: string };
  }>;
}

// ============================================================
// Auth / Session Types
// ============================================================

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: SubscriptionTier;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string | null;
  tier: SubscriptionTier;
  iat: number;
  exp: number;
}

// ============================================================
// Error Types
// ============================================================

export type AppErrorCode =
  | "INTERNAL_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "GSC_API_ERROR"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "PROPERTY_NOT_FOUND"
  | "CREDENTIAL_NOT_FOUND";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError("FORBIDDEN", message, 403);
  }

  static notFound(message = "Not found"): AppError {
    return new AppError("NOT_FOUND", message, 404);
  }

  static validation(message: string): AppError {
    return new AppError("VALIDATION_ERROR", message, 400);
  }

  static rateLimited(message = "Too many requests"): AppError {
    return new AppError("RATE_LIMITED", message, 429);
  }
}
