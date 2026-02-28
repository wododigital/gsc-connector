/**
 * OAuth2 Authorization Server
 * 
 * This module implements the OAuth2 endpoints that allow Claude.ai
 * and ChatGPT to authenticate users of the GSC Connect platform.
 * 
 * Supports:
 * - Dynamic Client Registration (RFC 7591)
 * - Authorization Code Grant with PKCE (RFC 7636)
 * - Token refresh
 * - Server metadata discovery (RFC 8414)
 * 
 * IMPORTANT: Claude.ai REQUIRES Dynamic Client Registration support.
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();
const APP_URL = process.env.APP_URL || "https://app.gscconnect.com";

// ============================================================
// 1. Server Metadata Discovery
// GET /.well-known/oauth-authorization-server
// ============================================================
router.get("/.well-known/oauth-authorization-server", (req: Request, res: Response) => {
  res.json({
    issuer: APP_URL,
    authorization_endpoint: `${APP_URL}/oauth/authorize`,
    token_endpoint: `${APP_URL}/oauth/token`,
    registration_endpoint: `${APP_URL}/oauth/register`,
    revocation_endpoint: `${APP_URL}/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    scopes_supported: ["gsc:read", "gsc:write"],
  });
});

// ============================================================
// 2. Dynamic Client Registration
// POST /oauth/register
// ============================================================
router.post("/oauth/register", async (req: Request, res: Response) => {
  /**
   * Claude.ai will call this endpoint to register itself as an OAuth client.
   * 
   * Request body (from Claude):
   * {
   *   "client_name": "Claude",
   *   "redirect_uris": ["https://claude.ai/api/..."],
   *   "grant_types": ["authorization_code", "refresh_token"],
   *   "response_types": ["code"],
   *   "token_endpoint_auth_method": "client_secret_post"
   * }
   * 
   * Response:
   * {
   *   "client_id": "generated-uuid",
   *   "client_secret": "generated-secret",
   *   "client_name": "Claude",
   *   "redirect_uris": [...],
   *   ...
   * }
   */

  const { client_name, redirect_uris, grant_types, response_types, token_endpoint_auth_method } =
    req.body;

  // Validate required fields
  if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    return res.status(400).json({ error: "invalid_client_metadata", error_description: "redirect_uris is required" });
  }

  // Generate client credentials
  const clientId = crypto.randomUUID();
  const clientSecret = crypto.randomBytes(32).toString("hex");
  const clientSecretHash = crypto.createHash("sha256").update(clientSecret).digest("hex");

  // TODO: Store in database (oauth_clients table)
  // await db.oauthClients.create({
  //   client_id: clientId,
  //   client_secret_hash: clientSecretHash,
  //   client_name: client_name || "Unknown Client",
  //   redirect_uris: redirect_uris,
  //   grant_types: grant_types || ["authorization_code", "refresh_token"],
  // });

  res.status(201).json({
    client_id: clientId,
    client_secret: clientSecret,
    client_name: client_name || "Unknown Client",
    redirect_uris,
    grant_types: grant_types || ["authorization_code", "refresh_token"],
    response_types: response_types || ["code"],
    token_endpoint_auth_method: token_endpoint_auth_method || "client_secret_post",
  });
});

// ============================================================
// 3. Authorization Endpoint
// GET /oauth/authorize
// ============================================================
router.get("/oauth/authorize", async (req: Request, res: Response) => {
  /**
   * Claude redirects the user's browser here.
   * 
   * Query parameters:
   * - response_type: "code"
   * - client_id: The registered client ID
   * - redirect_uri: Where to send the user back (must match registered URI)
   * - state: CSRF protection (pass back unchanged)
   * - code_challenge: PKCE challenge
   * - code_challenge_method: "S256"
   * - scope: requested scopes
   * 
   * This endpoint should:
   * 1. Show a login form if user is not authenticated
   * 2. Show a consent page with property selector
   * 3. On approval, generate an authorization code
   * 4. Redirect back to redirect_uri with code and state
   */

  const {
    response_type,
    client_id,
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method,
    scope,
  } = req.query as Record<string, string>;

  // Validate parameters
  if (response_type !== "code") {
    return res.status(400).json({ error: "unsupported_response_type" });
  }

  // TODO: Validate client_id exists in database
  // TODO: Validate redirect_uri matches registered URIs

  // TODO: Render the consent page (Next.js page or server-rendered HTML)
  // The consent page should:
  // 1. Show "Authorize [client_name]" header
  // 2. Show "wants to access your GSC Connect account"
  // 3. Show login form if not authenticated
  // 4. Show property selector (list user's GSC properties)
  // 5. Show "Authorize" and "Deny" buttons
  // 6. On authorize: generate auth code, redirect to redirect_uri

  // Placeholder: redirect to a Next.js page that handles the UI
  const authPageUrl = new URL(`${APP_URL}/oauth/consent`);
  authPageUrl.searchParams.set("client_id", client_id);
  authPageUrl.searchParams.set("redirect_uri", redirect_uri);
  authPageUrl.searchParams.set("state", state || "");
  authPageUrl.searchParams.set("code_challenge", code_challenge || "");
  authPageUrl.searchParams.set("code_challenge_method", code_challenge_method || "");
  authPageUrl.searchParams.set("scope", scope || "gsc:read");

  res.redirect(authPageUrl.toString());
});

// ============================================================
// 4. Authorization Code Generation (called by consent page)
// POST /oauth/authorize
// ============================================================
router.post("/oauth/authorize", async (req: Request, res: Response) => {
  /**
   * Called when user approves the authorization request.
   * 
   * Body:
   * - client_id, redirect_uri, state, code_challenge, code_challenge_method
   * - property_id: The GSC property the user selected
   * - user_id: The authenticated user (from session)
   * - action: "approve" or "deny"
   */

  const {
    client_id,
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method,
    property_id,
    action,
  } = req.body;

  if (action === "deny") {
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set("error", "access_denied");
    if (state) redirectUrl.searchParams.set("state", state);
    return res.redirect(redirectUrl.toString());
  }

  // Generate authorization code
  const code = crypto.randomBytes(32).toString("hex");
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  // TODO: Store in database (oauth_authorization_codes table)
  // await db.oauthAuthorizationCodes.create({
  //   code_hash: codeHash,
  //   user_id: req.session.userId,
  //   client_id,
  //   redirect_uri,
  //   property_id,
  //   code_challenge,
  //   code_challenge_method,
  //   expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  //   used: false,
  // });

  // Redirect back to Claude with the authorization code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (state) redirectUrl.searchParams.set("state", state);

  res.redirect(redirectUrl.toString());
});

// ============================================================
// 5. Token Endpoint
// POST /oauth/token
// ============================================================
router.post("/oauth/token", async (req: Request, res: Response) => {
  /**
   * Handles two grant types:
   * 
   * 1. authorization_code: Exchange code for access + refresh tokens
   *    Body: { grant_type, code, redirect_uri, client_id, client_secret, code_verifier }
   * 
   * 2. refresh_token: Get new access token using refresh token
   *    Body: { grant_type, refresh_token, client_id, client_secret }
   */

  const { grant_type } = req.body;

  if (grant_type === "authorization_code") {
    const { code, redirect_uri, client_id, client_secret, code_verifier } = req.body;

    // TODO: Validate client credentials
    // TODO: Look up authorization code from database
    // TODO: Verify code hasn't been used and hasn't expired
    // TODO: Verify redirect_uri matches
    // TODO: Verify PKCE code_verifier against stored code_challenge
    //   const expectedChallenge = crypto
    //     .createHash("sha256")
    //     .update(code_verifier)
    //     .digest("base64url");
    //   if (expectedChallenge !== storedCodeChallenge) { ... }
    // TODO: Mark code as used

    // Generate tokens
    const accessToken = crypto.randomBytes(32).toString("hex");
    const refreshToken = crypto.randomBytes(32).toString("hex");

    // TODO: Store tokens in database (oauth_tokens table)
    // Link to user_id and property_id from the authorization code

    res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600, // 1 hour
      refresh_token: refreshToken,
      scope: "gsc:read",
    });
  } else if (grant_type === "refresh_token") {
    const { refresh_token, client_id, client_secret } = req.body;

    // TODO: Validate client credentials
    // TODO: Look up refresh token from database
    // TODO: Generate new access token (and optionally rotate refresh token)

    const newAccessToken = crypto.randomBytes(32).toString("hex");

    res.json({
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: "gsc:read",
    });
  } else {
    res.status(400).json({
      error: "unsupported_grant_type",
      error_description: `Grant type '${grant_type}' is not supported`,
    });
  }
});

// ============================================================
// 6. Token Revocation
// POST /oauth/revoke
// ============================================================
router.post("/oauth/revoke", async (req: Request, res: Response) => {
  const { token, token_type_hint } = req.body;

  // TODO: Look up token in database and delete it
  // Try as access_token first, then refresh_token

  // Always return 200 per RFC 7009 (even if token not found)
  res.status(200).json({});
});

export default router;
