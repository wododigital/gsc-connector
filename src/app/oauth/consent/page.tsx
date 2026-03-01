import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { decrypt, encrypt } from "@/lib/encryption";
import { listGA4Properties } from "@/lib/ga4/api";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authorize - OMG AI",
};

interface ConsentPageProps {
  searchParams: Promise<{
    client_id?: string;
    redirect_uri?: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
    scope?: string;
    response_type?: string;
  }>;
}

async function getOAuthClient(clientId: string) {
  try {
    return await db.oAuthClient.findUnique({
      where: { clientId },
      select: {
        clientId: true,
        clientName: true,
        redirectUris: true,
      },
    });
  } catch {
    return null;
  }
}

async function getUserProperties(userId: string) {
  try {
    // Return ALL properties so the user can pick which ones to grant access to.
    // Previously-active ones are pre-checked as a convenience.
    return await db.gscProperty.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        siteUrl: true,
        permissionLevel: true,
        isActive: true,
      },
    });
  } catch {
    return [];
  }
}

async function getUserGA4Properties(userId: string) {
  try {
    // Read from DB first - populated during GSC connect callback
    const dbProps = await db.ga4Property.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        propertyId: true,
        displayName: true,
        accountName: true,
        isActive: true,
      },
    });

    if (dbProps.length > 0) return dbProps;

    // DB is empty - user may not have re-connected since analytics scope was added.
    // Fetch from Google Admin API using the stored credential.
    const credential = await db.googleCredential.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        accessTokenEncrypted: true,
        refreshTokenEncrypted: true,
        tokenExpiry: true,
      },
    });

    if (!credential) return [];

    // Get a valid access token (refresh if expired)
    let accessToken: string;
    const expiryBuffer = new Date(Date.now() + 5 * 60 * 1000);

    if (credential.tokenExpiry > expiryBuffer) {
      accessToken = decrypt(credential.accessTokenEncrypted);
    } else {
      const refreshToken = decrypt(credential.refreshTokenEncrypted);
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      });

      if (!res.ok) return [];

      const data = (await res.json()) as {
        access_token: string;
        expires_in: number;
      };
      accessToken = data.access_token;

      // Persist refreshed token
      await db.googleCredential.update({
        where: { id: credential.id },
        data: {
          accessTokenEncrypted: encrypt(accessToken),
          tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
        },
      });
    }

    // Fetch GA4 properties from Google Admin API
    // 403 = analytics scope not granted by user - that's OK, just return empty
    let ga4Props;
    try {
      ga4Props = await listGA4Properties(accessToken);
    } catch {
      // User likely hasn't granted analytics.readonly scope yet
      return [];
    }

    if (ga4Props.length === 0) return [];

    // Upsert all fetched properties into DB (default active=true)
    for (const prop of ga4Props) {
      try {
        await db.ga4Property.upsert({
          where: {
            userId_propertyId: { userId, propertyId: prop.property },
          },
          update: {
            displayName: prop.displayName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            accountName: (prop as any).accountName ?? null,
            credentialId: credential.id,
          },
          create: {
            userId,
            credentialId: credential.id,
            propertyId: prop.property,
            displayName: prop.displayName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            accountName: (prop as any).accountName ?? null,
            isActive: true,
          },
        });
      } catch {
        // Non-fatal - skip this property
      }
    }

    // Return from DB now that we've populated it
    return await db.ga4Property.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        propertyId: true,
        displayName: true,
        accountName: true,
        isActive: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const params = await searchParams;
  const {
    client_id,
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method,
    scope,
    response_type,
  } = params;

  // Validate required params
  if (!client_id || !redirect_uri) {
    return <ErrorPage message="Invalid authorization request - missing required parameters." />;
  }

  // Check session
  const session = await getSession();
  if (!session) {
    // Build return URL with all OAuth params preserved
    const currentUrl = buildConsentUrl(params);
    const loginUrl = `/auth/login?return_to=${encodeURIComponent(currentUrl)}`;

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-green-400">OMG AI</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <h1 className="text-lg font-semibold text-zinc-100 mb-3">Sign in required</h1>
            <p className="text-zinc-400 text-sm mb-6">
              You need to sign in before authorizing this integration.
            </p>
            <a
              href={loginUrl}
              className="inline-block px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign in with Google
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Look up OAuth client
  const oauthClient = await getOAuthClient(client_id);
  if (!oauthClient) {
    return <ErrorPage message="Unknown client application. Please contact the application developer." />;
  }

  // Validate redirect_uri is registered
  if (!oauthClient.redirectUris.includes(redirect_uri)) {
    return (
      <ErrorPage message="The redirect URI does not match the registered URIs for this client." />
    );
  }

  // Get user's GSC and GA4 properties
  const [properties, ga4Properties] = await Promise.all([
    getUserProperties(session.id),
    getUserGA4Properties(session.id),
  ]);

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <h1 className="text-lg font-semibold text-zinc-100 mb-3">
              No GSC properties connected
            </h1>
            <p className="text-zinc-400 text-sm mb-6">
              You need to connect at least one Google Search Console property before
              authorizing{" "}
              <span className="text-zinc-300 font-medium">{oauthClient.clientName}</span>.
            </p>
            <a
              href="/api/gsc/connect"
              className="inline-block px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Connect Google Search Console
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Pre-select previously active properties (or the first property if none are active)
  const hasActiveProperties = properties.some((p) => p.isActive);
  const hasActiveGA4Properties = ga4Properties.some((p) => p.isActive);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-xl font-bold text-green-400">OMG AI</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Top section */}
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-lg font-semibold text-zinc-100 mb-1">
              Authorize{" "}
              <span className="text-green-400">{oauthClient.clientName}</span>
            </h1>
            <p className="text-zinc-400 text-sm">
              <span className="font-medium text-zinc-300">{oauthClient.clientName}</span>{" "}
              wants to access your OMG AI account as{" "}
              <span className="text-zinc-300">{session.email}</span>.
            </p>
          </div>

          {/* Permissions */}
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              This will allow {oauthClient.clientName} to
            </h2>
            <ul className="space-y-2">
              {[
                "Read your Google Search Console data",
                "Query search analytics and keyword data",
                "View URL inspection results",
                "Access sitemap information",
              ].map((permission) => (
                <li
                  key={permission}
                  className="flex items-center gap-2 text-sm text-zinc-300"
                >
                  <span className="text-green-400 shrink-0">+</span>
                  {permission}
                </li>
              ))}
            </ul>
          </div>

          {/* GSC Property selection */}
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Google Search Console Properties
            </h2>
            <p className="text-xs text-zinc-500 mb-3">
              Select which GSC properties to grant access to.
            </p>
            <form
              action="/api/oauth/authorize"
              method="POST"
              id="consent-form"
            >
              {/* Hidden OAuth params */}
              <input type="hidden" name="client_id" value={client_id} />
              <input type="hidden" name="redirect_uri" value={redirect_uri} />
              {state && <input type="hidden" name="state" value={state} />}
              {code_challenge && (
                <input type="hidden" name="code_challenge" value={code_challenge} />
              )}
              {code_challenge_method && (
                <input
                  type="hidden"
                  name="code_challenge_method"
                  value={code_challenge_method}
                />
              )}
              {scope && <input type="hidden" name="scope" value={scope} />}
              {response_type && (
                <input type="hidden" name="response_type" value={response_type} />
              )}

              {/* GSC Property checkboxes */}
              <div className="space-y-2">
                {properties.map((property, index) => (
                  <label
                    key={property.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 hover:border-zinc-600 cursor-pointer has-[:checked]:border-green-700 has-[:checked]:bg-green-950/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      name="property_id"
                      value={property.id}
                      defaultChecked={
                        hasActiveProperties ? property.isActive : index === 0
                      }
                      className="accent-green-500 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-100 font-mono truncate">
                        {property.siteUrl}
                      </p>
                      <p className="text-xs text-zinc-500 capitalize">
                        {property.permissionLevel.replace("site", "").toLowerCase()} access
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* GA4 Property section - only show if user has GA4 properties */}
              {ga4Properties.length > 0 && (
                <div className="mt-5">
                  <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Google Analytics 4 Properties
                  </h2>
                  <p className="text-xs text-zinc-500 mb-3">
                    Select which GA4 properties to grant access to (optional).
                  </p>
                  <div className="space-y-2">
                    {ga4Properties.map((property, index) => (
                      <label
                        key={property.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 hover:border-zinc-600 cursor-pointer has-[:checked]:border-blue-700 has-[:checked]:bg-blue-950/30 transition-colors"
                      >
                        <input
                          type="checkbox"
                          name="ga4_property_id"
                          value={property.id}
                          defaultChecked={
                            hasActiveGA4Properties ? property.isActive : index === 0
                          }
                          className="accent-blue-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-100 font-mono truncate">
                            {property.displayName}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {property.propertyId}
                            {property.accountName && (
                              <span className="ml-1">- {property.accountName}</span>
                            )}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Actions */}
          <div className="p-6 flex gap-3">
            <button
              type="submit"
              form="consent-form"
              name="action"
              value="authorize"
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Authorize
            </button>
            <button
              type="submit"
              form="consent-form"
              name="action"
              value="deny"
              className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
            >
              Deny
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          Signed in as {session.email}.{" "}
          <a href="/api/auth/logout" className="text-zinc-500 hover:text-zinc-400">
            Not you?
          </a>
        </p>
      </div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <span className="text-xl font-bold text-green-400">OMG AI</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 font-bold">!</span>
          </div>
          <h1 className="text-lg font-semibold text-zinc-100 mb-3">
            Authorization error
          </h1>
          <p className="text-zinc-400 text-sm mb-6">{message}</p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

function buildConsentUrl(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  return `/oauth/consent?${searchParams.toString()}`;
}
