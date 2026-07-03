import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { decrypt, encrypt } from "@/lib/encryption";
import { listGA4Properties } from "@/lib/ga4/api";
import { getPlatformAccessMap } from "@/lib/platform-access";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authorize - OMG Bridge",
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

async function getAccountLevelServices(userId: string) {
  // GBP/GTM/Ads are account-level: no property selection needed. The MCP
  // tools discover locations/containers/customer IDs at call time, so the
  // consent page only reports whether the scope is granted (and offers an
  // inline connect for what's missing).
  try {
    const [credentials, access] = await Promise.all([
      db.googleCredential.findMany({ where: { userId }, select: { scopes: true } }),
      getPlatformAccessMap(userId),
    ]);
    const allScopes = credentials.map((c) => c.scopes).join(" ");
    return {
      gbp: allScopes.includes("business.manage"),
      gtm: allScopes.includes("tagmanager"),
      ads: allScopes.includes("auth/adwords"),
      gtmEntitled: access.gtm,
      adsEntitled: access.google_ads,
    };
  } catch {
    return { gbp: false, gtm: false, ads: false, gtmEntitled: false, adsEntitled: false };
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
    return (
      <ErrorPage message="Invalid authorization request. Required parameters are missing." />
    );
  }

  // Check session
  const session = await getSession();
  if (!session) {
    const currentUrl = buildConsentUrl(params);
    const loginUrl = `/auth/login?return_to=${encodeURIComponent(currentUrl)}`;

    return (
      <ConsentShell>
        <ConsentCard
          eyebrow="01 / SIGN IN REQUIRED"
          title={
            <>
              Sign in to <span className="accent">authorize.</span>
            </>
          }
          lede="You need an OMG Bridge account before you can connect this integration."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <a href={loginUrl} className="btn btn-primary" style={{ justifyContent: "center" }}>
              Sign in with Google
            </a>
            <p style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "center", margin: 0 }}>
              You will return to this page after sign in.
            </p>
          </div>
        </ConsentCard>
      </ConsentShell>
    );
  }

  // Look up OAuth client
  const oauthClient = await getOAuthClient(client_id);
  if (!oauthClient) {
    return (
      <ErrorPage message="Unknown client application. Contact the application developer." />
    );
  }

  if (!oauthClient.redirectUris.includes(redirect_uri)) {
    return (
      <ErrorPage message="The redirect URI does not match the registered URIs for this client." />
    );
  }

  // Get user's GSC and GA4 properties + account-level service status
  const [properties, ga4Properties, services] = await Promise.all([
    getUserProperties(session.id),
    getUserGA4Properties(session.id),
    getAccountLevelServices(session.id),
  ]);

  // So inline connect flows can return here with all OAuth params intact
  const consentReturnUrl = buildConsentUrl(params);

  if (properties.length === 0) {
    return (
      <ConsentShell>
        <ConsentCard
          eyebrow="02 / NO PROPERTIES CONNECTED"
          title={
            <>
              Connect a <span className="accent">property first.</span>
            </>
          }
          lede={
            <>
              You need at least one Google Search Console property connected before authorizing{" "}
              <strong>{oauthClient.clientName}</strong>.
            </>
          }
        >
          <a
            href={`/api/gsc/connect?return_to=${encodeURIComponent(buildConsentUrl(params))}`}
            className="btn btn-primary"
            style={{ justifyContent: "center" }}
          >
            Connect Google Search Console
          </a>
        </ConsentCard>
      </ConsentShell>
    );
  }

  // Pre-select previously active properties (or the first property if none are active)
  const hasActiveProperties = properties.some((p) => p.isActive);
  const hasActiveGA4Properties = ga4Properties.some((p) => p.isActive);

  return (
    <ConsentShell>
      <ConsentCard
        eyebrow="03 / AUTHORIZE ACCESS"
        title={
          <>
            <span className="accent">{oauthClient.clientName}</span> wants to connect.
          </>
        }
        lede={
          <>
            <strong>{oauthClient.clientName}</strong> is asking to access your OMG Bridge account
            as <strong>{session.email}</strong>. Pick the properties it can read.
          </>
        }
      >
        <form action="/api/oauth/authorize" method="POST" id="consent-form">
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

          {/* Scopes summary */}
          <div className="consent-section">
            <div className="consent-section-label">Scopes Requested</div>
            <div className="scope-list">
              {[
                "Read Google Search Console data",
                "Query search analytics and keyword data",
                "View URL inspection results",
                "Access sitemap information",
              ].map((permission) => (
                <span key={permission} className="pill info">
                  {permission}
                </span>
              ))}
            </div>
          </div>

          {/* GSC Property checkboxes */}
          <div className="consent-section" data-prop-section>
            <div className="consent-section-head">
              <div>
                <div className="consent-section-label">
                  Search Console Properties
                  <span className="count">{properties.length}</span>
                </div>
                <p className="consent-section-hint">
                  Select which GSC properties to grant access to.
                </p>
              </div>
              <div className="select-controls">
                <button type="button" data-select="all">ALL</button>
                <button type="button" data-select="none">NONE</button>
              </div>
            </div>
            {properties.length > 6 && (
              <input
                type="search"
                className="prop-filter"
                placeholder="Filter properties..."
                data-filter
              />
            )}
            <div className="prop-list">
              {properties.map((property, index) => (
                <label key={property.id} className="prop-item">
                  <input
                    type="checkbox"
                    name="property_id"
                    value={property.id}
                    defaultChecked={
                      hasActiveProperties ? property.isActive : index === 0
                    }
                  />
                  <div className="prop-meta">
                    <div className="prop-url">{property.siteUrl}</div>
                    <div className="prop-sub">
                      {property.permissionLevel.replace("site", "").toLowerCase()} access
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* GA4 Property section - only show if user has GA4 properties */}
          {ga4Properties.length > 0 && (
            <div className="consent-section" data-prop-section>
              <div className="consent-section-head">
                <div>
                  <div className="consent-section-label">
                    Google Analytics 4 Properties
                    <span className="count">{ga4Properties.length}</span>
                  </div>
                  <p className="consent-section-hint">
                    Optional. Select which GA4 properties to grant access to.
                  </p>
                </div>
                <div className="select-controls">
                  <button type="button" data-select="all">ALL</button>
                  <button type="button" data-select="none">NONE</button>
                </div>
              </div>
              {ga4Properties.length > 6 && (
                <input
                  type="search"
                  className="prop-filter"
                  placeholder="Filter properties..."
                  data-filter
                />
              )}
              <div className="prop-list">
                {ga4Properties.map((property, index) => (
                  <label key={property.id} className="prop-item ga4">
                    <input
                      type="checkbox"
                      name="ga4_property_id"
                      value={property.id}
                      defaultChecked={
                        hasActiveGA4Properties ? property.isActive : index === 0
                      }
                    />
                    <div className="prop-meta">
                      <div className="prop-url">{property.displayName}</div>
                      <div className="prop-sub">
                        {property.propertyId}
                        {property.accountName && (
                          <span> · {property.accountName}</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Account-level services: nothing to select - status + inline connect */}
          <div className="consent-section">
            <div className="consent-section-label">Account-Level Services</div>
            <p className="consent-section-hint">
              These have no properties to pick - once connected, they are included automatically.
            </p>
            <div className="svc-list">
              <ServiceRow
                label="Business Profile"
                connected={services.gbp}
                connectHref={`/api/gsc/connect?return_to=${encodeURIComponent(consentReturnUrl)}`}
              />
              {services.gtmEntitled && (
                <ServiceRow
                  label="Tag Manager"
                  connected={services.gtm}
                  connectHref={`/api/platform/connect?platform=gtm&return_to=${encodeURIComponent(consentReturnUrl)}`}
                />
              )}
              {services.adsEntitled && (
                <ServiceRow
                  label="Google Ads"
                  connected={services.ads}
                  connectHref={`/api/platform/connect?platform=google_ads&return_to=${encodeURIComponent(consentReturnUrl)}`}
                />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="consent-actions">
            <button
              type="submit"
              form="consent-form"
              name="action"
              value="authorize"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
            >
              Allow
            </button>
            <button
              type="submit"
              form="consent-form"
              name="action"
              value="deny"
              className="btn"
              style={{ flex: 1, justifyContent: "center" }}
            >
              Deny
            </button>
          </div>
        </form>
      </ConsentCard>

      <div className="consent-foot">
        <span>
          Signed in as <strong>{session.email}</strong>.{" "}
          <a href="/api/auth/logout">Not you?</a>
        </span>
        <span>
          By authorizing, you accept our <a href="/terms">Terms</a> and{" "}
          <a href="/privacy">Privacy Policy</a>.
        </span>
      </div>
      {/* next/script survives hydration; a raw <script> injected via JSX
          does not execute if React replaces the server HTML. */}
      <Script id="consent-interactions" strategy="afterInteractive">
        {CONSENT_JS}
      </Script>
    </ConsentShell>
  );
}

function ServiceRow({
  label,
  connected,
  connectHref,
}: {
  label: string;
  connected: boolean;
  connectHref: string;
}) {
  return (
    <div className={`svc-row${connected ? " on" : ""}`}>
      <span className="svc-dot" />
      <span className="svc-name">{label}</span>
      {connected ? (
        <span className="svc-state">INCLUDED</span>
      ) : (
        <a href={connectHref} className="svc-connect">
          + CONNECT
        </a>
      )}
    </div>
  );
}

// Vanilla JS for the (otherwise server-rendered) consent form:
// per-section select all/none + text filter for long property lists.
const CONSENT_JS = `
document.querySelectorAll('[data-prop-section]').forEach(function (section) {
  var boxes = function () {
    return section.querySelectorAll('.prop-item:not([hidden]) input[type=checkbox]');
  };
  section.querySelectorAll('[data-select]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var check = btn.getAttribute('data-select') === 'all';
      boxes().forEach(function (b) { b.checked = check; });
    });
  });
  var filter = section.querySelector('[data-filter]');
  if (filter) {
    filter.addEventListener('input', function () {
      var q = filter.value.toLowerCase();
      section.querySelectorAll('.prop-item').forEach(function (item) {
        var text = item.textContent.toLowerCase();
        if (q && text.indexOf(q) === -1) { item.setAttribute('hidden', ''); }
        else { item.removeAttribute('hidden'); }
      });
    });
  }
});
`;

/* ────────────────────────────────────────────────────────────
 * Layout primitives + scoped CSS for the consent flow.
 * Mirrors the login card from the onboarding demo.
 * ──────────────────────────────────────────────────────────── */

function ConsentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="consent-page">
      {/* dangerouslySetInnerHTML avoids the text-content hydration mismatch
          a raw template-literal style tag triggers in the App Router */}
      <style dangerouslySetInnerHTML={{ __html: CONSENT_CSS }} />
      <header className="consent-topbar">
        <a href="/" className="brand">
          <img src="/omg-logo-light.webp" alt="OMG / BRIDGE" />
        </a>
        <div className="meta">
          <span className="dot" />
          <span>OAUTH · CONSENT</span>
        </div>
      </header>
      <main className="consent-main">{children}</main>
    </div>
  );
}

function ConsentCard({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="consent-card">
      <div className="consent-meta">
        <span className="num">{eyebrow.split(" / ")[0]}</span>
        <span>·</span>
        <span>{eyebrow.split(" / ").slice(1).join(" / ")}</span>
      </div>
      <h1 className="consent-title">{title}</h1>
      <p className="consent-lede">{lede}</p>
      {children}
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <ConsentShell>
      <div className="consent-card error">
        <div className="consent-meta">
          <span className="num err">!!</span>
          <span>·</span>
          <span>AUTHORIZATION ERROR</span>
        </div>
        <h1 className="consent-title">
          Something <span className="accent">went wrong.</span>
        </h1>
        <p className="consent-lede">{message}</p>
        <a
          href="/dashboard"
          className="btn"
          style={{ justifyContent: "center" }}
        >
          Go to dashboard
        </a>
      </div>
    </ConsentShell>
  );
}

function buildConsentUrl(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  return `/oauth/consent?${searchParams.toString()}`;
}

const CONSENT_CSS = `
.consent-page {
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  position: relative;
}
.consent-page::before {
  content: '';
  position: fixed; inset: 0;
  background:
    radial-gradient(60% 50% at 18% 0%,   rgba(0, 181, 181, 0.10), transparent 60%),
    radial-gradient(50% 40% at 85% 100%, rgba(255, 107, 74, 0.06), transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.consent-topbar {
  position: sticky; top: 0;
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 28px;
  background: rgba(10, 16, 24, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--teal);
  z-index: 10;
}
.consent-topbar .brand img {
  height: 26px; width: auto; display: block;
}
.consent-topbar .meta {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--body);
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.consent-topbar .meta .dot {
  width: 6px; height: 6px;
  background: var(--teal);
  box-shadow: 0 0 6px var(--teal);
  border-radius: 50%;
}

.consent-main {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 56px 24px;
  position: relative; z-index: 1;
}

.consent-card {
  width: 100%;
  max-width: 620px;
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 44px 40px;
  position: relative;
  box-shadow:
    0 30px 80px -20px rgba(0,0,0,0.6),
    0 0 80px rgba(0, 181, 181, 0.06);
}
.consent-card::after {
  content: '';
  position: absolute;
  top: -10px; right: -10px;
  width: 64px; height: 64px;
  background: var(--vermilion);
  z-index: -1;
}
.consent-card.error::after { background: var(--vermilion); }

.consent-meta {
  display: flex; gap: 14px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 22px;
}
.consent-meta .num { color: var(--vermilion); font-family: var(--mono); }
.consent-meta .num.err { color: var(--vermilion); }

.consent-title {
  font-family: var(--display);
  font-weight: 700;
  font-size: 30px;
  line-height: 1.05;
  letter-spacing: -0.035em;
  text-transform: uppercase;
  margin-bottom: 14px;
  color: var(--ink);
}
.consent-title .accent { color: var(--teal); }

.consent-lede {
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.6;
  margin-bottom: 28px;
}
.consent-lede strong { color: var(--ink); font-weight: 600; }

.consent-section {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid var(--rule);
}
.consent-section:first-of-type { margin-top: 0; padding-top: 0; border-top: none; }
.consent-section-label {
  display: block;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 6px;
}
.consent-section-hint {
  font-size: 12px;
  color: var(--ink-3);
  margin: 0 0 14px 0;
}

.scope-list {
  display: flex; flex-wrap: wrap; gap: 6px;
}

.consent-section-head {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
}
.consent-section-label .count {
  margin-left: 8px;
  font-family: var(--mono);
  color: var(--teal);
}
.select-controls { display: flex; gap: 6px; flex-shrink: 0; }
.select-controls button {
  font-size: 10px;
  letter-spacing: 0.12em;
  font-family: var(--body);
  color: var(--ink-3);
  background: transparent;
  border: 1px solid var(--rule);
  padding: 4px 10px;
  cursor: pointer;
  transition: color .15s, border-color .15s;
}
.select-controls button:hover { color: var(--teal); border-color: var(--teal); }

.prop-filter {
  width: 100%;
  margin-bottom: 10px;
  padding: 9px 12px;
  background: var(--bg);
  border: 1px solid var(--rule);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 12px;
}
.prop-filter:focus { outline: none; border-color: var(--teal); }

.prop-list {
  display: flex; flex-direction: column; gap: 8px;
  max-height: 236px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--rule-strong) transparent;
}
.prop-list::-webkit-scrollbar { width: 6px; }
.prop-list::-webkit-scrollbar-thumb { background: var(--rule-strong); }

.svc-list { display: flex; flex-direction: column; gap: 6px; }
.svc-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--bg);
  border: 1px solid var(--rule);
}
.svc-row .svc-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--rule-strong);
  flex-shrink: 0;
}
.svc-row.on .svc-dot { background: var(--teal); box-shadow: 0 0 6px var(--teal); }
.svc-row .svc-name { flex: 1; font-size: 13px; color: var(--ink); }
.svc-row .svc-state {
  font-size: 10px; letter-spacing: 0.14em;
  color: var(--teal);
  font-family: var(--mono);
}
.svc-row .svc-connect {
  font-size: 10px; letter-spacing: 0.14em;
  color: var(--vermilion);
  text-decoration: none;
  border: 1px solid var(--rule);
  padding: 5px 10px;
  transition: border-color .15s;
}
.svc-row .svc-connect:hover { border-color: var(--vermilion); }
.prop-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: var(--bg);
  border: 1px solid var(--rule);
  cursor: pointer;
  transition: border-color .18s, background .18s;
}
.prop-item:hover { border-color: var(--rule-strong); }
.prop-item[hidden] { display: none; }
.prop-item:has(:checked) {
  border-color: var(--teal);
  background: rgba(0, 181, 181, 0.06);
}
.prop-item.ga4:has(:checked) {
  border-color: var(--magenta);
  background: rgba(226, 111, 183, 0.06);
}
.prop-item input {
  appearance: none;
  width: 16px; height: 16px;
  border: 1px solid var(--rule-strong);
  background: var(--surface-2);
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: all .15s;
}
.prop-item input:checked {
  background: var(--teal);
  border-color: var(--teal);
}
.prop-item.ga4 input:checked {
  background: var(--magenta);
  border-color: var(--magenta);
}
.prop-item input:checked::after {
  content: '';
  position: absolute;
  left: 4px; top: 1px;
  width: 5px; height: 9px;
  border: solid var(--bg);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.prop-meta {
  flex: 1;
  min-width: 0;
}
.prop-url {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prop-sub {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-top: 2px;
}

.consent-actions {
  margin-top: 28px;
  padding: 22px 0 4px;
  border-top: 1px solid var(--rule);
  display: flex; gap: 10px;
  position: sticky; bottom: 0;
  background: var(--surface-1);
}

.consent-foot {
  display: flex; flex-direction: column; gap: 6px;
  margin-top: 22px;
  text-align: center;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.04em;
  max-width: 520px;
  width: 100%;
}
.consent-foot strong { color: var(--ink-2); font-weight: 500; }
.consent-foot a { color: var(--teal); text-decoration: none; }
.consent-foot a:hover { color: var(--vermilion); }

@media (max-width: 600px) {
  .consent-topbar { padding: 12px 18px; }
  .consent-topbar .meta { display: none; }
  .consent-main { padding: 32px 16px; }
  .consent-card { padding: 32px 24px; }
  .consent-title { font-size: 24px; }
  .consent-actions { flex-direction: column; }
}
`;
