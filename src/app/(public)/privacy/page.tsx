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
    <div className="max-w-3xl mx-auto px-6 py-20">
      <div className="mb-10">
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--accent-light)",
            marginBottom: 12,
          }}
        >
          Legal
        </div>
        <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div
        className="prose-policy"
        style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 15 }}
      >
        <Section title="1. Who we are">
          <p>
            OMG Bridge is operated by <strong style={{ color: "var(--text-primary)" }}>WODO Digital</strong>{" "}
            (referred to as &quot;WODO&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). OMG Bridge
            is a service that connects Google Search Console, Google Analytics 4,
            and Google Business Profile data to AI assistants via the Model
            Context Protocol (MCP). This Privacy Policy describes how we handle
            information you provide when you use bridge.theomg.ai.
          </p>
        </Section>

        <Section title="2. Data we collect">
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
              The list of Google Search Console properties, GA4 properties, and
              Google Business Profile locations associated with your account
            </li>
          </ul>
          <p>
            We also keep operational logs of MCP tool calls (which tool was
            called, which property, and the response time) so we can enforce
            usage quotas, debug issues, and show you usage analytics. These
            logs do not contain the content of search queries or GA4 reports.
          </p>
        </Section>

        <Section title="3. Google API scopes we request">
          <p>
            We only request the minimum scopes needed to read your data. We
            never request write access to your search analytics or analytics
            data:
          </p>
          <ul>
            <li>
              <code style={inlineCode}>openid</code>,{" "}
              <code style={inlineCode}>email</code>,{" "}
              <code style={inlineCode}>profile</code> &mdash; to identify your
              account
            </li>
            <li>
              <code style={inlineCode}>webmasters.readonly</code> &mdash; to
              read your Google Search Console data
            </li>
            <li>
              <code style={inlineCode}>analytics.readonly</code> &mdash; to
              read your Google Analytics 4 reports
            </li>
            <li>
              <code style={inlineCode}>business.manage</code> &mdash; to read
              your Google Business Profile locations, reviews, and performance
              data (used in read-only mode)
            </li>
          </ul>
          <p>
            You explicitly consent to these scopes on Google&apos;s consent
            screen before we receive any tokens.
          </p>
        </Section>

        <Section title="4. How we store your data">
          <p>
            Your Google OAuth refresh token and access token are encrypted at
            rest using <strong style={{ color: "var(--text-primary)" }}>AES-256-GCM</strong>{" "}
            with a key held only on our application servers. Tokens are never
            written to logs, never returned in API responses, and never visible
            in our admin dashboard.
          </p>
          <p>
            API keys you generate for Claude Desktop or Cursor are stored as
            SHA-256 hashes &mdash; we cannot recover the plaintext key once
            you have closed the &quot;copy key&quot; dialog. Account passwords
            are not stored at all because authentication is handled entirely
            through Google OAuth.
          </p>
        </Section>

        <Section title="5. How we use your data">
          <p>We use your data only to:</p>
          <ul>
            <li>
              Respond to MCP tool calls from AI sessions you have explicitly
              authorized (Claude.ai, ChatGPT, Claude Desktop, Cursor, or any
              other MCP-compatible client)
            </li>
            <li>Enforce per-plan usage limits and bill paid plans correctly</li>
            <li>
              Show you your own usage history and connected properties on the
              dashboard
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

        <Section title="6. Sharing and third parties">
          <p>
            We do not sell your data and we do not share it with third parties
            for marketing or analytics. The only third parties that touch your
            data are infrastructure providers we need to run the service:
          </p>
          <ul>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Google LLC</strong>{" "}
              &mdash; the source of all GSC, GA4, and GBP data; we call
              Google&apos;s APIs on your behalf
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Stripe, Inc.</strong>{" "}
              &mdash; payment processing for the Annual plan; Stripe receives
              your email and billing details only when you check out
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Our hosting and database providers</strong>{" "}
              &mdash; for compute, storage, and email; bound by data
              processing agreements
            </li>
          </ul>
          <p>
            Each AI client you authorize (e.g., Claude.ai) receives only the
            scoped tool responses you ask for &mdash; never your refresh token
            or your underlying Google credentials.
          </p>
        </Section>

        <Section title="7. Your rights and controls">
          <p>You can, at any time:</p>
          <ul>
            <li>
              Disconnect your Google account from the OMG Bridge dashboard,
              which deletes your stored tokens immediately
            </li>
            <li>
              Toggle individual GSC, GA4, or GBP properties off so they are no
              longer accessible to your AI tools
            </li>
            <li>
              Revoke a previously issued OAuth client (e.g., Claude.ai) from
              your dashboard so it can no longer call our MCP endpoint on your
              behalf
            </li>
            <li>
              Revoke OMG Bridge entirely from your Google account&apos;s
              security settings:{" "}
              <Link
                href="https://myaccount.google.com/permissions"
                style={{ color: "var(--accent-light)" }}
              >
                myaccount.google.com/permissions
              </Link>
            </li>
            <li>
              Request export or deletion of all data we hold about you by
              emailing us
            </li>
          </ul>
          <p>
            Account deletion removes your tokens, properties, API keys, and
            usage logs from our active database. Encrypted backups are rotated
            out within 30 days.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            We use a small number of strictly necessary cookies and equivalent
            local storage entries:
          </p>
          <ul>
            <li>
              <code style={inlineCode}>gsc_session</code> &mdash; your signed
              session JWT (expires after 30 days)
            </li>
            <li>
              <code style={inlineCode}>oauth_state</code>,{" "}
              <code style={inlineCode}>oauth_next</code> &mdash; short-lived
              CSRF protection during the Google OAuth flow
            </li>
          </ul>
          <p>
            We do not use analytics cookies, advertising cookies, or any
            third-party tracking pixels.
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            We follow industry-standard practices: TLS in transit, AES-256-GCM
            for refresh tokens at rest, SHA-256 hashes for API keys, PKCE for
            our OAuth flows, per-user rate limiting, and the principle of least
            privilege for both Google scopes and internal access. If you
            believe you have found a security issue, please contact us using
            the email below.
          </p>
        </Section>

        <Section title="10. Data location and retention">
          <p>
            Data is stored on infrastructure located in the European Union and
            the United States. We retain your data while your account is
            active. When you delete your account, we remove your data from
            production within 7 days and from backups within 30 days, except
            where we are required to retain billing records for tax and
            accounting compliance.
          </p>
        </Section>

        <Section title="11. Children">
          <p>
            OMG Bridge is not directed at children under 16, and we do not
            knowingly collect data from anyone in that age range.
          </p>
        </Section>

        <Section title="12. Changes to this policy">
          <p>
            If we make material changes, we will update the &quot;Last
            updated&quot; date above and notify active users by email at least
            7 days before the change takes effect.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            For privacy questions, data export requests, or deletion requests,
            email us at{" "}
            <a
              href="mailto:privacy@theomg.ai"
              style={{ color: "var(--accent-light)" }}
            >
              privacy@theomg.ai
            </a>
            .
          </p>
          <p>
            See also our{" "}
            <Link href="/terms" style={{ color: "var(--accent-light)" }}>
              Terms of Service
            </Link>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      <div className="policy-body">{children}</div>
      <style>{`
        .policy-body p { margin-bottom: 12px; }
        .policy-body ul { padding-left: 20px; margin-bottom: 12px; list-style: disc; }
        .policy-body li { margin-bottom: 6px; }
      `}</style>
    </section>
  );
}

const inlineCode: React.CSSProperties = {
  background: "rgba(6,10,16,0.6)",
  border: "1px solid var(--glass-border)",
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: 13,
  color: "var(--accent-light)",
  fontFamily: "monospace",
};
