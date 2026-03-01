/**
 * GSC Connect - Configuration Module
 * Reads and validates environment variables at startup.
 * Owned by: Architect agent
 */

import { AppError } from "../types/index.js";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue = ""): string {
  return process.env[key] ?? defaultValue;
}

function requireEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return num;
}

export const config = {
  env: optionalEnv("NODE_ENV", "development") as "development" | "production" | "test",

  app: {
    url: optionalEnv("APP_URL", "http://localhost:3000").replace(/\/$/, ""),
    secret: optionalEnv("APP_SECRET"),
    encryptionKey: optionalEnv("ENCRYPTION_KEY"),
  },

  ports: {
    web: requireEnvNumber("PORT", 3000),
    mcp: requireEnvNumber("MCP_PORT", 3001),
  },

  database: {
    url: optionalEnv("DATABASE_URL", "postgresql://gscconnect@localhost:5432/gscconnect"),
  },

  google: {
    clientId: optionalEnv("GOOGLE_CLIENT_ID"),
    clientSecret: optionalEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: optionalEnv(
      "GOOGLE_REDIRECT_URI",
      "http://localhost:3000/api/gsc/callback"
    ),
    apiKey: optionalEnv("GOOGLE_API_KEY"),
  },

  jwt: {
    // Access tokens expire in 1 hour
    accessTokenTtl: requireEnvNumber("JWT_ACCESS_TTL", 3600),
    // Refresh tokens expire in 30 days
    refreshTokenTtl: requireEnvNumber("JWT_REFRESH_TTL", 30 * 24 * 3600),
  },

  rateLimits: {
    // Per-user MCP requests per minute
    mcpRequestsPerMinute: requireEnvNumber("RATE_LIMIT_MCP", 100),
    // Auth endpoint requests per minute
    authRequestsPerMinute: requireEnvNumber("RATE_LIMIT_AUTH", 10),
  },

  tiers: {
    free: {
      maxProperties: 1,
      dailyQueryLimit: 100,
    },
    pro: {
      maxProperties: 10,
      dailyQueryLimit: 10000,
    },
    agency: {
      maxProperties: 100,
      dailyQueryLimit: 100000,
    },
  },
} as const;

/**
 * Validate critical config at startup.
 * Call this once when the server starts.
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.app.secret) {
    errors.push("APP_SECRET is required");
  }
  if (!config.app.encryptionKey) {
    errors.push("ENCRYPTION_KEY is required");
  }
  if (config.app.encryptionKey && config.app.encryptionKey.length !== 64) {
    errors.push("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  if (!config.database.url) {
    errors.push("DATABASE_URL is required");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }
}

export type Config = typeof config;
