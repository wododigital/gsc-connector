import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - OMG Bridge",
  description:
    "How OMG Bridge collects, stores, and uses your Google account data. We never sell your data and store all tokens AES-256 encrypted at rest.",
};

const LAST_UPDATED = "May 10, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="page-shell">
      {/* HERO */}
      <section className="legal-hero">
        <div className="gutter">
          <div className="num">01</div>
        </div>
        <div className="legal-hero-body">
          <div className="section-eyebrow">
            <span className="num">01</span>
            <span>LEGAL</span>
            <span className="rule" />
          </div>
          <h1>
            Privacy <span className="accent">Policy.</span>
          </h1>
          <p className="meta">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* POLICY BODY */}
      <section className="legal-section">
        <div className="gutter">
          <div className="num">02</div>
        </div>
        <div className="legal-body">
          <Section n="01" title="Who we are">
            <p>
              OMG Bridge is operated by <strong>WODO Digital</strong> (referred
              to as &quot;WODO&quot;, &quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;). OMG Bridge is a service that connects Google
              Search Console, Google Analytics 4, and Google Business Profile
              data to AI assistants via the Model Context Protocol (MCP). This
              Privacy Policy describes how we handle information you provide
              when you use bridge.theomg.ai.
            </p>
          </Section>

          <Section n="02" title="Data we collect">
            <p>When you sign in with Google, we collect and store:</p>
            <ul>
              <li>Your Google account email address</li>
              <li>Your Google account display name</li>
              <li>Your Google profile picture URL</li>
              <li>Your Google account ID</li>
              <li>
                An OAuth refresh token and short-lived access token issued by
                Google (so we can call Google APIs on your behalf)
              </li>
              <li>
                The list of Google Search Console properties, GA4 properties,
                and Google Business Profile locations associated with your
                account
              </li>
            </ul>
            <p>
              We also keep operational logs of MCP tool calls (which tool was
              called, which property, and the response time) so we can enforce
              usage quotas, debug issues, and show you usage analytics. These
              logs do not contain the content of search queries or GA4
              reports.
            </p>
          </Section>

          <Section n="03" title="Google API scopes we request">
            <p>
              We only request the minimum scopes needed to read your data. We
              never request write access to your search analytics or analytics
              data:
            </p>
            <ul>
              <li>
                <code>openid</code>, <code>email</code>, <code>profile</code>{" "}
                to identify your account
              </li>
              <li>
                <code>webmasters.readonly</code> to read your Google Search
                Console data
              </li>
              <li>
                <code>analytics.readonly</code> to read your Google Analytics 4
                reports
              </li>
              <li>
                <code>business.manage</code> to read your Google Business
                Profile locations, reviews, and performance data (used in
                read-only mode)
              </li>
            </ul>
            <p>
              You explicitly consent to these scopes on Google&apos;s consent
              screen before we receive any tokens.
            </p>
          </Section>

          <Section n="04" title="How we store your data">
            <p>
              Your Google OAuth refresh token and access token are encrypted at
              rest using <strong>AES-256-GCM</strong> with a key held only on
              our application servers. Tokens are never written to logs, never
              returned in API responses, and never visible in our admin
              dashboard.
            </p>
            <p>
              API keys you generate for Claude Desktop or Cursor are stored as
              SHA-256 hashes. We cannot recover the plaintext key once you have
              closed the &quot;copy key&quot; dialog. Account passwords are not
              stored at all because authentication is handled entirely through
              Google OAuth.
            </p>
          </Section>

          <Section n="05" title="How we use your data">
            <p>We use your data only to:</p>
            <ul>
              <li>
                Respond to MCP tool calls from AI sessions you have explicitly
                authorized (Claude.ai, ChatGPT, Claude Desktop, Cursor, or any
                other MCP-compatible client)
              </li>
              <li>
                Enforce per-plan usage limits and bill paid plans correctly
              </li>
              <li>
                Show you your own usage history and connected properties on
                the dashboard
              </li>
              <li>
                Diagnose errors, prevent abuse, and improve reliability of the
                service
              </li>
            </ul>
            <p>
              We do not train AI models on your data, we do not aggregate your
              data with other customers, and we do not use your data for
              advertising.
            </p>
          </Section>

          <Section n="06" title="Sharing and third parties">
            <p>
              We do not sell your data and we do not share it with third
              parties for marketing or analytics. The only third parties that
              touch your data are infrastructure providers we need to run the
              service:
            </p>
            <ul>
              <li>
                <strong>Google LLC</strong>. The source of all GSC, GA4, and
                GBP data; we call Google&apos;s APIs on your behalf
              </li>
              <li>
                <strong>Stripe, Inc.</strong>. Payment processing for the
                Annual plan; Stripe receives your email and billing details
                only when you check out
              </li>
              <li>
                <strong>Our hosting and database providers</strong>. For
                compute, storage, and email; bound by data processing
                agreements
              </li>
            </ul>
            <p>
              Each AI client you authorize (e.g., Claude.ai) receives only the
              scoped tool responses you ask for. Never your refresh token or
              your underlying Google credentials.
            </p>
          </Section>

          <Section n="07" title="Your rights and controls">
            <p>You can, at any time:</p>
            <ul>
              <li>
                Disconnect your Google account from the OMG Bridge dashboard,
                which deletes your stored tokens immediately
              </li>
              <li>
                Toggle individual GSC, GA4, or GBP properties off so they are
                no longer accessible to your AI tools
              </li>
              <li>
                Revoke a previously issued OAuth client (e.g., Claude.ai) from
                your dashboard so it can no longer call our MCP endpoint on
                your behalf
              </li>
              <li>
                Revoke OMG Bridge entirely from your Google account&apos;s
                security settings:{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noreferrer"
                >
                  myaccount.google.com/permissions
                </a>
              </li>
              <li>
                Request export or deletion of all data we hold about you by
                emailing us
              </li>
            </ul>
            <p>
              Account deletion removes your tokens, properties, API keys, and
              usage logs from our active database. Encrypted backups are
              rotated out within 30 days.
            </p>
          </Section>

          <Section n="08" title="Cookies">
            <p>
              We use a small number of strictly necessary cookies and
              equivalent local storage entries:
            </p>
            <ul>
              <li>
                <code>gsc_session</code>. Your signed session JWT (expires
                after 30 days)
              </li>
              <li>
                <code>oauth_state</code>, <code>oauth_next</code>. Short-lived
                CSRF protection during the Google OAuth flow
              </li>
            </ul>
            <p>
              We do not use analytics cookies, advertising cookies, or any
              third-party tracking pixels.
            </p>
          </Section>

          <Section n="09" title="Security">
            <p>
              We follow industry-standard practices: TLS in transit,
              AES-256-GCM for refresh tokens at rest, SHA-256 hashes for API
              keys, PKCE for our OAuth flows, per-user rate limiting, and the
              principle of least privilege for both Google scopes and internal
              access. If you believe you have found a security issue, please
              contact us using the email below.
            </p>
          </Section>

          <Section n="10" title="Data location and retention">
            <p>
              Data is stored on infrastructure located in the European Union
              and the United States. We retain your data while your account is
              active. When you delete your account, we remove your data from
              production within 7 days and from backups within 30 days, except
              where we are required to retain billing records for tax and
              accounting compliance.
            </p>
          </Section>

          <Section n="11" title="Children">
            <p>
              OMG Bridge is not directed at children under 16, and we do not
              knowingly collect data from anyone in that age range.
            </p>
          </Section>

          <Section n="12" title="Changes to this policy">
            <p>
              If we make material changes, we will update the &quot;Last
              updated&quot; date above and notify active users by email at
              least 7 days before the change takes effect.
            </p>
          </Section>

          <Section n="13" title="Contact">
            <p>
              For privacy questions, data export requests, or deletion
              requests, email us at{" "}
              <a href="mailto:privacy@theomg.ai">privacy@theomg.ai</a>.
            </p>
            <p>
              See also our <Link href="/terms">Terms of Service</Link>.
            </p>
          </Section>
        </div>
      </section>

      <LegalStyles />
    </div>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-block">
      <div className="legal-block-head">
        <span className="legal-block-num">{n}</span>
        <h2>{title}</h2>
      </div>
      <div className="legal-block-body">{children}</div>
    </section>
  );
}

function LegalStyles() {
  return (
    <style>{`
      .page-shell { min-height: 100%; }

      .legal-hero,
      .legal-section {
        display: grid;
        grid-template-columns: 80px 1fr;
        border-bottom: 1px solid var(--rule);
      }
      .legal-hero .gutter,
      .legal-section .gutter {
        border-right: 1px solid var(--rule);
        padding: 40px 16px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .legal-hero .gutter .num,
      .legal-section .gutter .num {
        font-family: var(--display);
        font-size: 38px;
        font-weight: 700;
        color: var(--ink);
        letter-spacing: -0.04em;
        line-height: 1;
      }
      .legal-hero-body { padding: 64px 56px 56px; max-width: 1100px; }
      .legal-hero h1 {
        font-family: var(--display);
        font-weight: 700;
        font-size: clamp(40px, 5.4vw, 64px);
        line-height: 1.0;
        letter-spacing: -0.035em;
        text-transform: uppercase;
        margin-bottom: 14px;
      }
      .legal-hero h1 .accent { color: var(--vermilion); }
      .legal-hero .meta {
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--ink-3);
      }
      .legal-body {
        padding: 48px 56px 80px;
        max-width: 820px;
      }

      .legal-block {
        margin-bottom: 40px;
        padding-bottom: 32px;
        border-bottom: 1px solid var(--rule);
      }
      .legal-block:last-child { border-bottom: none; margin-bottom: 0; }
      .legal-block-head {
        display: flex;
        align-items: baseline;
        gap: 16px;
        margin-bottom: 16px;
      }
      .legal-block-num {
        font-family: var(--display);
        font-weight: 700;
        font-size: 14px;
        color: var(--vermilion);
        letter-spacing: 0.04em;
      }
      .legal-block-head h2 {
        font-family: var(--display);
        font-weight: 700;
        font-size: 22px;
        letter-spacing: -0.02em;
        text-transform: uppercase;
        color: var(--ink);
      }
      .legal-block-body {
        font-size: 14.5px;
        line-height: 1.75;
        color: var(--ink-2);
      }
      .legal-block-body p { margin-bottom: 14px; }
      .legal-block-body p:last-child { margin-bottom: 0; }
      .legal-block-body strong { color: var(--ink); font-weight: 600; }
      .legal-block-body a {
        color: var(--teal-bright);
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
      }
      .legal-block-body a:hover { color: var(--vermilion); }
      .legal-block-body code {
        font-family: var(--mono);
        font-size: 12.5px;
        background: var(--surface-1);
        border: 1px solid var(--rule);
        padding: 1px 6px;
        color: var(--teal-bright);
      }
      .legal-block-body ul {
        list-style: none;
        padding: 0;
        margin: 0 0 14px;
      }
      .legal-block-body ul li {
        position: relative;
        padding: 6px 0 6px 22px;
        border-bottom: 1px dashed var(--rule);
      }
      .legal-block-body ul li:last-child { border-bottom: none; }
      .legal-block-body ul li::before {
        content: "+";
        position: absolute;
        left: 0;
        top: 6px;
        color: var(--teal-bright);
        font-weight: 700;
      }

      @media (max-width: 980px) {
        .legal-hero,
        .legal-section { grid-template-columns: 1fr; }
        .legal-hero .gutter,
        .legal-section .gutter { display: none; }
        .legal-hero-body { padding: 40px 20px 40px; }
        .legal-body { padding: 32px 20px 56px; }
      }
    `}</style>
  );
}
