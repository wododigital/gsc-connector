/**
 * Google OAuth helpers for building auth URLs and exchanging codes.
 * Used for both platform login (openid/email/profile) and
 * GSC connection (webmasters.readonly).
 */

export function buildGoogleAuthUrl(params: {
  scopes: string[];
  redirectUri: string;
  state: string;
  accessType?: string;
}): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scopes.join(" "));
  url.searchParams.set("state", params.state);
  url.searchParams.set("access_type", params.accessType ?? "offline");
  // Force consent to ensure we always receive a refresh token
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
}> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const err = await response.json() as Record<string, unknown>;
    throw new Error(`Google token exchange failed: ${JSON.stringify(err)}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    id_token?: string;
  }>;
}

export async function getGoogleUserInfo(accessToken: string): Promise<{
  sub: string;
  email: string;
  name: string;
  picture?: string;
}> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get user info from Google");
  }

  return response.json() as Promise<{
    sub: string;
    email: string;
    name: string;
    picture?: string;
  }>;
}
