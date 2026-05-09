import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - OMG Bridge",
  description:
    "Terms of Service for OMG Bridge. Acceptable use, plan limits, billing, refunds, and liability for the bridge.theomg.ai service.",
};

const LAST_UPDATED = "May 10, 2026";

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 15 }}>
        <Section title="1. Agreement">
          <p>
            These Terms of Service (&quot;Terms&quot;) form a binding agreement
            between you and{" "}
            <strong style={{ color: "var(--text-primary)" }}>WODO Digital</strong>{" "}
            (&quot;WODO&quot;, &quot;we&quot;, &quot;us&quot;) for your use of
            OMG Bridge at{" "}
            <strong style={{ color: "var(--text-primary)" }}>bridge.theomg.ai</strong>{" "}
            and any related APIs, MCP endpoints, and dashboards
            (the &quot;Service&quot;). By signing in, you agree to these Terms
            and to our{" "}
            <Link href="/privacy" style={{ color: "var(--accent-light)" }}>
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="2. The Service">
          <p>
            OMG Bridge is a Model Context Protocol (MCP) bridge that lets
            authorized AI assistants &mdash; such as Claude.ai, ChatGPT, Claude
            Desktop, and Cursor &mdash; query your Google Search Console,
            Google Analytics 4, and Google Business Profile data. We do not
            generate, modify, or warrant the accuracy of the underlying data,
            which comes directly from Google&apos;s APIs.
          </p>
        </Section>

        <Section title="3. Account requirements">
          <p>
            To use the Service you must (a) be at least 16 years old, (b) have
            a Google account with access to one or more GSC, GA4, or GBP
            properties, and (c) provide accurate information when signing in.
            You are responsible for the security of your account, your API
            keys, and any AI clients you authorize.
          </p>
        </Section>

        <Section title="4. Acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>
              Use the Service to access data you do not own or are not
              authorized to access on behalf of a customer
            </li>
            <li>
              Resell, redistribute, or republish data retrieved through the
              Service except in your own internal reports and dashboards
            </li>
            <li>
              Run automated scrapers or bots against the Service that bypass
              rate limits or plan quotas
              </li>
            <li>
              Attempt to reverse-engineer, probe for vulnerabilities, or
              circumvent the security of the Service
            </li>
            <li>
              Share an API key publicly or commit one to a public source
              repository
            </li>
            <li>
              Violate Google&apos;s API Services User Data Policy or any
              applicable law
            </li>
          </ul>
          <p>
            We may suspend or terminate accounts that violate these rules.
          </p>
        </Section>

        <Section title="5. Plans and usage limits">
          <p>The Service is offered on two plans:</p>
          <ul>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Free</strong>{" "}
              &mdash; $0, includes 200 tool calls per month and 1 connected
              Google account
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Annual</strong>{" "}
              &mdash; $199 per year, includes unlimited tool calls and
              unlimited connected Google accounts
            </li>
          </ul>
          <p>
            Tool call counters reset on the first day of each billing period.
            If you exceed the Free plan&apos;s monthly limit, tool calls are
            blocked until the next reset or until you upgrade. We may revise
            plan limits with at least 30 days&apos; notice.
          </p>
        </Section>

        <Section title="6. Payment, renewal and refunds">
          <p>
            The Annual plan is billed once per year through Stripe and renews
            automatically on the anniversary of your initial charge unless you
            cancel beforehand. You authorize WODO and Stripe to charge your
            payment method for the renewal at the then-current published
            price.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Refunds:</strong>{" "}
            We offer a 7-day refund window from the date of any charge. Email
            us within 7 days at{" "}
            <a
              href="mailto:billing@theomg.ai"
              style={{ color: "var(--accent-light)" }}
            >
              billing@theomg.ai
            </a>{" "}
            and we will issue a full refund. After 7 days, charges are
            non-refundable, but you can cancel future renewals from the
            billing portal at any time and your access will continue until the
            end of the paid period.
          </p>
        </Section>

        <Section title="7. Coupon codes">
          <p>
            Coupon codes apply only to the plan and duration described at the
            time of redemption, are limited per user, and may be revoked or
            modified by us at any time before redemption. Coupon codes have no
            cash value and cannot be combined with other offers.
          </p>
        </Section>

        <Section title="8. Your data">
          <p>
            Data you connect through Google OAuth remains yours. You grant
            WODO a limited, non-exclusive license to access and process that
            data solely to operate the Service for you, in line with our{" "}
            <Link href="/privacy" style={{ color: "var(--accent-light)" }}>
              Privacy Policy
            </Link>
            . You can revoke this license at any time by disconnecting your
            Google account or deleting your OMG Bridge account.
          </p>
        </Section>

        <Section title="9. Service availability">
          <p>
            The Service is provided on a best-effort basis. We do not offer a
            specific uptime guarantee or SLA at this time. Scheduled
            maintenance, Google API outages, or third-party infrastructure
            issues may cause brief interruptions. We will use reasonable
            efforts to communicate planned downtime in advance.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            You can stop using the Service at any time and delete your account
            from the dashboard. We may suspend or terminate your access if you
            materially breach these Terms, if continued service would expose
            us to legal or security risk, or if your payment method fails and
            is not corrected within 14 days. On termination, your right to use
            the Service ends, and we will delete your data per the retention
            schedule in our Privacy Policy.
          </p>
        </Section>

        <Section title="11. Disclaimer of warranties">
          <p style={{ textTransform: "none" }}>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT
            THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT THE DATA
            RETRIEVED FROM GOOGLE WILL BE ACCURATE OR COMPLETE.
          </p>
        </Section>

        <Section title="12. Limitation of liability">
          <p>
            To the maximum extent permitted by law, WODO and its officers,
            employees, and agents are not liable for any indirect, incidental,
            special, consequential, or punitive damages, or for lost profits,
            revenues, data, or goodwill, arising out of or related to the
            Service. Our total cumulative liability for any claim arising out
            of or related to these Terms or the Service is limited to the
            greater of (a) the amount you paid WODO in the 12 months preceding
            the claim, or (b) USD 100.
          </p>
        </Section>

        <Section title="13. Indemnification">
          <p>
            You agree to defend and indemnify WODO from any claim or demand
            (including reasonable legal fees) arising from your misuse of the
            Service, your violation of these Terms, or your infringement of a
            third party&apos;s rights.
          </p>
        </Section>

        <Section title="14. Governing law">
          <p>
            These Terms are governed by the laws of India, without regard to
            its conflict of laws principles. Any dispute will be brought
            exclusively in the courts located in Bengaluru, Karnataka, India,
            unless local consumer protection law requires otherwise.
          </p>
        </Section>

        <Section title="15. Changes to these Terms">
          <p>
            We may update these Terms from time to time. If we make material
            changes, we will update the &quot;Last updated&quot; date above
            and notify active users by email at least 7 days before the change
            takes effect. Continued use of the Service after that date
            constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="16. Contact">
          <p>
            Questions about these Terms? Email{" "}
            <a
              href="mailto:hello@theomg.ai"
              style={{ color: "var(--accent-light)" }}
            >
              hello@theomg.ai
            </a>
            . For billing questions, email{" "}
            <a
              href="mailto:billing@theomg.ai"
              style={{ color: "var(--accent-light)" }}
            >
              billing@theomg.ai
            </a>
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
