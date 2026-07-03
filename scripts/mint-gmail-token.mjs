#!/usr/bin/env node
/**
 * Mint a Gmail API refresh token for the admin-alert sender.
 *
 * One-time local flow (loopback redirect):
 *   node scripts/mint-gmail-token.mjs <CLIENT_ID> <CLIENT_SECRET>
 *
 * Prerequisites (separate GCP project or at least a separate OAuth client
 * from the app's verified one - gmail.send is a RESTRICTED scope):
 *   1. Enable the Gmail API.
 *   2. OAuth consent screen: External, publishing status "In production"
 *      (unverified is fine - only we consent; testing mode would expire the
 *      refresh token after 7 days).
 *   3. Create OAuth Client ID of type "Web application" with redirect URI
 *      http://localhost:8765/callback
 *   4. Run this script and log in AS THE SENDING MAILBOX.
 *
 * Prints GMAIL_ALERT_REFRESH_TOKEN to paste into Railway env vars.
 */

import http from "node:http";
import { exec } from "node:child_process";

const [clientId, clientSecret] = process.argv.slice(2);
if (!clientId || !clientSecret) {
  console.error("Usage: node scripts/mint-gmail-token.mjs <CLIENT_ID> <CLIENT_SECRET>");
  process.exit(1);
}

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = "https://www.googleapis.com/auth/gmail.send";

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error || !code) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(`OAuth error: ${error ?? "no code returned"}`);
    console.error("OAuth error:", error ?? "no code returned");
    server.close();
    process.exit(1);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.refresh_token) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Token exchange failed - see terminal.");
    console.error("Token exchange failed:", JSON.stringify(tokens, null, 2));
    server.close();
    process.exit(1);
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<h2>Done. Refresh token printed in your terminal - you can close this tab.</h2>");

  console.log("\n=== SUCCESS ===");
  console.log("Add these to Railway env vars (and the vault):\n");
  console.log(`GMAIL_ALERT_CLIENT_ID=${clientId}`);
  console.log(`GMAIL_ALERT_CLIENT_SECRET=${clientSecret}`);
  console.log(`GMAIL_ALERT_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("GMAIL_ALERT_SENDER=<the mailbox you just logged in with>");
  console.log("ADMIN_ALERT_EMAIL=shyam@wodo.digital");

  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log("Opening Google consent screen... log in as the SENDING mailbox.");
  console.log(`If the browser does not open, visit:\n${authUrl.toString()}\n`);
  exec(`open "${authUrl.toString()}"`);
});
