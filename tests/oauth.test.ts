/**
 * OAuth flow tests
 * - POST /api/oauth/register: DCR (Dynamic Client Registration)
 * - GET /api/oauth/authorize: authorization request validation
 * - POST /api/oauth/token: authorization_code + refresh_token grants
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { mockDb, mockGetSession } from "./setup";

// ---------------------------------------------------------------------------
// Helper: build a NextRequest
// ---------------------------------------------------------------------------
function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    contentType?: string;
  } = {}
): NextRequest {
  const { method = "GET", body, headers = {}, contentType } = options;
  const init: RequestInit = { method, headers: { ...headers } };
  if (body !== undefined) {
    if (contentType === "application/x-www-form-urlencoded") {
      init.body = body as string;
      (init.headers as Record<string, string>)["content-type"] =
        "application/x-www-form-urlencoded";
    } else {
      init.body = JSON.stringify(body);
      (init.headers as Record<string, string>)["content-type"] =
        "application/json";
    }
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

// ===================================================================
// POST /api/oauth/register - Dynamic Client Registration
// ===================================================================
describe("POST /api/oauth/register", () => {
  let registerHandler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetAllMocks();
    // Re-import to get fresh module with mocks applied
    const mod = await import("@/app/api/oauth/register/route");
    registerHandler = mod.POST;
    // Default: create succeeds
    mockDb.oAuthClient.create.mockResolvedValue({
      id: "uuid-1",
      clientId: "generated-uuid",
      clientSecretHash: "hash",
      clientName: "Test App",
      redirectUris: ["https://example.com/callback"],
      grantTypes: ["authorization_code", "refresh_token"],
      tokenEndpointAuthMethod: "client_secret_post",
    });
  });

  it("registers a valid client and returns 201", async () => {
    const req = makeRequest("http://localhost:3000/api/oauth/register", {
      method: "POST",
      body: {
        client_name: "My App",
        redirect_uris: ["https://example.com/callback"],
      },
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.client_id).toBeDefined();
    expect(json.client_secret).toBeDefined();
    expect(json.redirect_uris).toEqual(["https://example.com/callback"]);
    expect(json.grant_types).toContain("authorization_code");
  });

  it("rejects missing redirect_uris with 400", async () => {
    const req = makeRequest("http://localhost:3000/api/oauth/register", {
      method: "POST",
      body: { client_name: "Bad App" },
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_client_metadata");
    expect(json.error_description).toContain("redirect_uris");
  });

  it("rejects empty redirect_uris array with 400", async () => {
    const req = makeRequest("http://localhost:3000/api/oauth/register", {
      method: "POST",
      body: { client_name: "Bad App", redirect_uris: [] },
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_client_metadata");
  });

  it("rejects javascript: scheme in redirect_uris", async () => {
    const req = makeRequest("http://localhost:3000/api/oauth/register", {
      method: "POST",
      body: {
        client_name: "Evil App",
        redirect_uris: ["javascript:alert(1)"],
      },
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_client_metadata");
    expect(json.error_description).toContain("scheme");
  });

  it("rejects data: scheme in redirect_uris", async () => {
    const req = makeRequest("http://localhost:3000/api/oauth/register", {
      method: "POST",
      body: {
        client_name: "Evil App",
        redirect_uris: ["data:text/html,<script>alert(1)</script>"],
      },
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_client_metadata");
  });

  it("rejects non-JSON request body", async () => {
    const req = new NextRequest(
      new URL("http://localhost:3000/api/oauth/register"),
      {
        method: "POST",
        body: "not json",
        headers: { "content-type": "application/json" },
      }
    );

    const res = await registerHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_client_metadata");
  });

  it("defaults client_name to 'Unknown Client' when omitted", async () => {
    const req = makeRequest("http://localhost:3000/api/oauth/register", {
      method: "POST",
      body: {
        redirect_uris: ["https://example.com/callback"],
      },
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.client_name).toBe("Unknown Client");
  });
});

// ===================================================================
// GET /api/oauth/authorize - Authorization request
// ===================================================================
describe("GET /api/oauth/authorize", () => {
  let authorizeGet: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import("@/app/api/oauth/authorize/route");
    authorizeGet = mod.GET;
  });

  it("returns 400 when client_id is missing", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/oauth/authorize?response_type=code&redirect_uri=https://example.com/cb"
    );

    const res = await authorizeGet(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_request");
    expect(json.error_description).toContain("client_id");
  });

  it("returns 400 when response_type is not 'code'", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/oauth/authorize?response_type=token&client_id=abc&redirect_uri=https://example.com/cb"
    );

    const res = await authorizeGet(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("unsupported_response_type");
  });

  it("returns 400 when redirect_uri is missing", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/oauth/authorize?response_type=code&client_id=abc"
    );

    const res = await authorizeGet(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_request");
    expect(json.error_description).toContain("redirect_uri");
  });

  it("returns 400 when client_id is unknown", async () => {
    mockDb.oAuthClient.findUnique.mockResolvedValueOnce(null);

    const req = makeRequest(
      "http://localhost:3000/api/oauth/authorize?response_type=code&client_id=unknown&redirect_uri=https://example.com/cb"
    );

    const res = await authorizeGet(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_client");
  });

  it("returns 400 when redirect_uri does not match registration", async () => {
    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      redirectUris: ["https://registered.com/callback"],
    });

    const req = makeRequest(
      "http://localhost:3000/api/oauth/authorize?response_type=code&client_id=valid-client&redirect_uri=https://evil.com/steal"
    );

    const res = await authorizeGet(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_request");
    expect(json.error_description).toContain("redirect_uri");
  });

  it("redirects to login when user has no session", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      redirectUris: ["https://example.com/callback"],
    });

    const req = makeRequest(
      "http://localhost:3000/api/oauth/authorize?response_type=code&client_id=valid-client&redirect_uri=https://example.com/callback"
    );

    const res = await authorizeGet(req);
    // Should redirect (302 or 307) to login page
    expect([301, 302, 303, 307, 308]).toContain(res.status);

    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/auth/login");
  });

  it("redirects to consent page when user is logged in with valid params", async () => {
    mockGetSession.mockResolvedValueOnce({
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      subscriptionTier: "free",
    });
    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      redirectUris: ["https://example.com/callback"],
    });

    const req = makeRequest(
      "http://localhost:3000/api/oauth/authorize?response_type=code&client_id=valid-client&redirect_uri=https://example.com/callback&code_challenge=abc123&code_challenge_method=S256"
    );

    const res = await authorizeGet(req);
    expect([301, 302, 303, 307, 308]).toContain(res.status);

    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/oauth/consent");
    expect(location).toContain("client_id=valid-client");
  });
});

// ===================================================================
// POST /api/oauth/authorize - Consent approval
// ===================================================================
describe("POST /api/oauth/authorize", () => {
  let authorizePost: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import("@/app/api/oauth/authorize/route");
    authorizePost = mod.POST;
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const req = makeRequest("http://localhost:3000/api/oauth/authorize", {
      method: "POST",
      body: { client_id: "abc", redirect_uri: "https://example.com/cb" },
    });

    const res = await authorizePost(req);
    expect(res.status).toBe(401);
  });

  it("rejects plain PKCE method (only S256 accepted)", async () => {
    mockGetSession.mockResolvedValueOnce({
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      subscriptionTier: "free",
    });

    const req = makeRequest("http://localhost:3000/api/oauth/authorize", {
      method: "POST",
      body: {
        client_id: "valid-client",
        redirect_uri: "https://example.com/callback",
        code_challenge: "some-challenge",
        code_challenge_method: "plain",
        action: "approve",
        property_id: "prop-1",
      },
    });

    const res = await authorizePost(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_request");
    expect(json.error_description).toContain("S256");
  });

  it("rejects when no property is selected", async () => {
    mockGetSession.mockResolvedValueOnce({
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      subscriptionTier: "free",
    });
    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      redirectUris: ["https://example.com/callback"],
    });

    const req = makeRequest("http://localhost:3000/api/oauth/authorize", {
      method: "POST",
      body: {
        client_id: "valid-client",
        redirect_uri: "https://example.com/callback",
        action: "approve",
        // no property_id
      },
    });

    const res = await authorizePost(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error_description).toContain("property");
  });
});

// ===================================================================
// POST /api/oauth/token - Token exchange
// ===================================================================
describe("POST /api/oauth/token", () => {
  let tokenHandler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import("@/app/api/oauth/token/route");
    tokenHandler = mod.POST;
  });

  it("rejects unsupported grant_type", async () => {
    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      body: { grant_type: "client_credentials" },
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("unsupported_grant_type");
  });

  it("rejects authorization_code grant with missing code", async () => {
    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      body: {
        grant_type: "authorization_code",
        redirect_uri: "https://example.com/cb",
        client_id: "valid-client",
      },
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_request");
    expect(json.error_description).toContain("code");
  });

  it("rejects authorization_code grant with invalid code", async () => {
    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      clientSecretHash: createHash("sha256").update("secret123").digest("hex"),
      tokenEndpointAuthMethod: "client_secret_post",
    });
    mockDb.oAuthAuthorizationCode.findUnique.mockResolvedValueOnce(null);

    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      body: {
        grant_type: "authorization_code",
        code: "invalid-code",
        redirect_uri: "https://example.com/cb",
        client_id: "valid-client",
        client_secret: "secret123",
      },
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_grant");
  });

  it("rejects expired authorization code", async () => {
    const code = randomBytes(32).toString("hex");
    const codeHash = createHash("sha256").update(code).digest("hex");

    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      clientSecretHash: createHash("sha256").update("secret123").digest("hex"),
      tokenEndpointAuthMethod: "client_secret_post",
    });

    mockDb.oAuthAuthorizationCode.findUnique.mockResolvedValueOnce({
      id: "code-1",
      codeHash,
      userId: "user-1",
      clientId: "valid-client",
      redirectUri: "https://example.com/cb",
      propertyId: "prop-1",
      codeChallenge: null,
      codeChallengeMethod: null,
      scopes: "gsc:read",
      expiresAt: new Date(Date.now() - 60000), // expired 1 minute ago
      used: false,
    });

    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      body: {
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://example.com/cb",
        client_id: "valid-client",
        client_secret: "secret123",
      },
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_grant");
    expect(json.error_description).toContain("expired");
  });

  it("rejects already-used authorization code", async () => {
    const code = randomBytes(32).toString("hex");
    const codeHash = createHash("sha256").update(code).digest("hex");

    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      clientSecretHash: createHash("sha256").update("secret123").digest("hex"),
      tokenEndpointAuthMethod: "client_secret_post",
    });

    mockDb.oAuthAuthorizationCode.findUnique.mockResolvedValueOnce({
      id: "code-1",
      codeHash,
      userId: "user-1",
      clientId: "valid-client",
      redirectUri: "https://example.com/cb",
      propertyId: "prop-1",
      codeChallenge: null,
      codeChallengeMethod: null,
      scopes: "gsc:read",
      expiresAt: new Date(Date.now() + 600000),
      used: true, // already used
    });

    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      body: {
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://example.com/cb",
        client_id: "valid-client",
        client_secret: "secret123",
      },
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_grant");
    expect(json.error_description).toContain("already been used");
  });

  it("exchanges a valid authorization code with PKCE for tokens", async () => {
    const code = randomBytes(32).toString("hex");
    const codeHash = createHash("sha256").update(code).digest("hex");
    const codeVerifier = randomBytes(32).toString("hex");
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      clientSecretHash: createHash("sha256").update("secret123").digest("hex"),
      tokenEndpointAuthMethod: "client_secret_post",
    });

    mockDb.oAuthAuthorizationCode.findUnique.mockResolvedValueOnce({
      id: "code-1",
      codeHash,
      userId: "user-1",
      clientId: "valid-client",
      redirectUri: "https://example.com/cb",
      propertyId: "prop-1",
      codeChallenge,
      codeChallengeMethod: "S256",
      scopes: "gsc:read",
      expiresAt: new Date(Date.now() + 600000),
      used: false,
    });

    mockDb.oAuthAuthorizationCode.update.mockResolvedValueOnce({});
    mockDb.oAuthToken.create.mockResolvedValueOnce({});

    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      body: {
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://example.com/cb",
        client_id: "valid-client",
        client_secret: "secret123",
        code_verifier: codeVerifier,
      },
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.access_token).toBeDefined();
    expect(json.refresh_token).toBeDefined();
    expect(json.token_type).toBe("Bearer");
    expect(json.expires_in).toBe(3600);
    expect(json.scope).toBe("gsc:read");
  });

  it("rejects PKCE with wrong code_verifier", async () => {
    const code = randomBytes(32).toString("hex");
    const codeHash = createHash("sha256").update(code).digest("hex");
    const codeChallenge = createHash("sha256")
      .update("correct-verifier")
      .digest("base64url");

    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      clientSecretHash: createHash("sha256").update("secret123").digest("hex"),
      tokenEndpointAuthMethod: "client_secret_post",
    });

    mockDb.oAuthAuthorizationCode.findUnique.mockResolvedValueOnce({
      id: "code-1",
      codeHash,
      userId: "user-1",
      clientId: "valid-client",
      redirectUri: "https://example.com/cb",
      propertyId: "prop-1",
      codeChallenge,
      codeChallengeMethod: "S256",
      scopes: "gsc:read",
      expiresAt: new Date(Date.now() + 600000),
      used: false,
    });

    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      body: {
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://example.com/cb",
        client_id: "valid-client",
        client_secret: "secret123",
        code_verifier: "wrong-verifier",
      },
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_grant");
    expect(json.error_description).toContain("PKCE");
  });

  it("issues new tokens on refresh_token grant (token rotation)", async () => {
    const refreshToken = randomBytes(32).toString("hex");
    const refreshTokenHash = createHash("sha256").update(refreshToken).digest("hex");

    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      clientSecretHash: createHash("sha256").update("secret123").digest("hex"),
      tokenEndpointAuthMethod: "client_secret_post",
    });

    mockDb.oAuthToken.findUnique.mockResolvedValueOnce({
      id: "token-1",
      userId: "user-1",
      clientId: "valid-client",
      accessTokenHash: "old-hash",
      refreshTokenHash,
      propertyId: "prop-1",
      scopes: "gsc:read",
      expiresAt: new Date(Date.now() + 3600000),
    });

    mockDb.oAuthToken.update.mockResolvedValueOnce({});

    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      body: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: "valid-client",
        client_secret: "secret123",
      },
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.access_token).toBeDefined();
    expect(json.refresh_token).toBeDefined();
    // New tokens should differ from old refresh
    expect(json.refresh_token).not.toBe(refreshToken);
    expect(json.token_type).toBe("Bearer");
    expect(json.expires_in).toBe(3600);
  });

  it("rejects invalid refresh_token", async () => {
    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      clientSecretHash: createHash("sha256").update("secret123").digest("hex"),
      tokenEndpointAuthMethod: "client_secret_post",
    });

    mockDb.oAuthToken.findUnique.mockResolvedValueOnce(null);

    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      body: {
        grant_type: "refresh_token",
        refresh_token: "invalid-token",
        client_id: "valid-client",
        client_secret: "secret123",
      },
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_grant");
  });

  it("rejects refresh_token with wrong client_id", async () => {
    const refreshToken = randomBytes(32).toString("hex");
    const refreshTokenHash = createHash("sha256").update(refreshToken).digest("hex");

    mockDb.oAuthClient.findUnique.mockResolvedValueOnce({
      id: "client-1",
      clientId: "valid-client",
      clientSecretHash: createHash("sha256").update("secret123").digest("hex"),
      tokenEndpointAuthMethod: "client_secret_post",
    });

    mockDb.oAuthToken.findUnique.mockResolvedValueOnce({
      id: "token-1",
      userId: "user-1",
      clientId: "other-client", // wrong client
      accessTokenHash: "old-hash",
      refreshTokenHash,
      propertyId: "prop-1",
      scopes: "gsc:read",
      expiresAt: new Date(Date.now() + 3600000),
    });

    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      body: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: "valid-client",
        client_secret: "secret123",
      },
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("invalid_grant");
    expect(json.error_description).toContain("client_id mismatch");
  });

  it("accepts form-encoded request body", async () => {
    const req = makeRequest("http://localhost:3000/api/oauth/token", {
      method: "POST",
      contentType: "application/x-www-form-urlencoded",
      body: "grant_type=unsupported_type",
    });

    const res = await tokenHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("unsupported_grant_type");
  });
});
