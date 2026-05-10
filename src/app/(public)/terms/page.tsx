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
            Terms of <span className="accent">Service.</span>
          </h1>
          <p className="meta">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* TERMS BODY */}
      <section className="legal-section">
        <div className="gutter">
          <div className="num">02</div>
        </div>
        <div className="legal-body">
          <Section n="01" title="Agreement">
            <p>
              These Terms of Service (&quot;Terms&quot;) form a binding
              agreement between you and <strong>WODO Digital</strong>{" "}
              (&quot;WODO&quot;, &quot;we&quot;, &quot;us&quot;) for your use
              of OMG Bridge at <strong>bridge.theomg.ai</strong> and any
              related APIs, MCP endpoints, and dashboards (the
              &quot;Service&quot;). By signing in, you agree to these Terms
              and to our <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </Section>

          <Section n="02" title="The Service">
            <p>
              OMG Bridge is a Model Context Protocol (MCP) bridge that lets
              authorized AI assistants such as Claude.ai, ChatGPT, Claude
              Desktop, and Cursor query your Google Search Console, Google
              Analytics 4, and Google Business Profile data. We do not
              generate, modify, or warrant the accuracy of the underlying
              data, which comes directly from Google&apos;s APIs.
            </p>
          </Section>

          <Section n="03" title="Account requirements">
            <p>
              To use the Service you must (a) be at least 16 years old, (b)
              have a Google account with access to one or more GSC, GA4, or
              GBP properties, and (c) provide accurate information when
              signing in. You are responsible for the security of your
              account, your API keys, and any AI clients you authorize.
            </p>
          </Section>

          <Section n="04" title="Acceptable use">
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

          <Section n="05" title="Plans and usage limits">
            <p>The Service is offered on two plans:</p>
            <ul>
              <li>
                <strong>Free</strong>. $0, includes 200 tool calls per month
                and 1 connected Google account
              </li>
              <li>
                <strong>Annual</strong>. $199 per year, includes unlimited
                tool calls and unlimited connected Google accounts
              </li>
            </ul>
            <p>
              Tool call counters reset on the first day of each billing
              period. If you exceed the Free plan&apos;s monthly limit, tool
              calls are blocked until the next reset or until you upgrade. We
              may revise plan limits with at least 30 days&apos; notice.
            </p>
          </Section>

          <Section n="06" title="Payment, renewal and refunds">
            <p>
              The Annual plan is billed once per year through Stripe and
              renews automatically on the anniversary of your initial charge
              unless you cancel beforehand. You authorize WODO and Stripe to
              charge your payment method for the renewal at the then-current
              published price.
            </p>
            <p>
              <strong>Refunds:</strong> We offer a 7-day refund window from
              the date of any charge. Email us within 7 days at{" "}
              <a href="mailto:billing@theomg.ai">billing@theomg.ai</a> and we
              will issue a full refund. After 7 days, charges are
              non-refundable, but you can cancel future renewals from the
              billing portal at any time and your access will continue until
              the end of the paid period.
            </p>
          </Section>

          <Section n="07" title="Coupon codes">
            <p>
              Coupon codes apply only to the plan and duration described at
              the time of redemption, are limited per user, and may be
              revoked or modified by us at any time before redemption. Coupon
              codes have no cash value and cannot be combined with other
              offers.
            </p>
          </Section>

          <Section n="08" title="Your data">
            <p>
              Data you connect through Google OAuth remains yours. You grant
              WODO a limited, non-exclusive license to access and process
              that data solely to operate the Service for you, in line with
              our <Link href="/privacy">Privacy Policy</Link>. You can revoke
              this license at any time by disconnecting your Google account
              or deleting your OMG Bridge account.
            </p>
          </Section>

          <Section n="09" title="Service availability">
            <p>
              The Service is provided on a best-effort basis. We do not offer
              a specific uptime guarantee or SLA at this time. Scheduled
              maintenance, Google API outages, or third-party infrastructure
              issues may cause brief interruptions. We will use reasonable
              efforts to communicate planned downtime in advance.
            </p>
          </Section>

          <Section n="10" title="Termination">
            <p>
              You can stop using the Service at any time and delete your
              account from the dashboard. We may suspend or terminate your
              access if you materially breach these Terms, if continued
              service would expose us to legal or security risk, or if your
              payment method fails and is not corrected within 14 days. On
              termination, your right to use the Service ends, and we will
              delete your data per the retention schedule in our Privacy
              Policy.
            </p>
          </Section>

          <Section n="11" title="Disclaimer of warranties">
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT
              THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT THE DATA
              RETRIEVED FROM GOOGLE WILL BE ACCURATE OR COMPLETE.
            </p>
          </Section>

          <Section n="12" title="Limitation of liability">
            <p>
              To the maximum extent permitted by law, WODO and its officers,
              employees, and agents are not liable for any indirect,
              incidental, special, consequential, or punitive damages, or for
              lost profits, revenues, data, or goodwill, arising out of or
              related to the Service. Our total cumulative liability for any
              claim arising out of or related to these Terms or the Service
              is limited to the greater of (a) the amount you paid WODO in
              the 12 months preceding the claim, or (b) USD 100.
            </p>
          </Section>

          <Section n="13" title="Indemnification">
            <p>
              You agree to defend and indemnify WODO from any claim or demand
              (including reasonable legal fees) arising from your misuse of
              the Service, your violation of these Terms, or your
              infringement of a third party&apos;s rights.
            </p>
          </Section>

          <Section n="14" title="Governing law">
            <p>
              These Terms are governed by the laws of India, without regard
              to its conflict of laws principles. Any dispute will be brought
              exclusively in the courts located in Bengaluru, Karnataka,
              India, unless local consumer protection law requires otherwise.
            </p>
          </Section>

          <Section n="15" title="Changes to these Terms">
            <p>
              We may update these Terms from time to time. If we make
              material changes, we will update the &quot;Last updated&quot;
              date above and notify active users by email at least 7 days
              before the change takes effect. Continued use of the Service
              after that date constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section n="16" title="Contact">
            <p>
              Questions about these Terms? Email{" "}
              <a href="mailto:hello@theomg.ai">hello@theomg.ai</a>. For
              billing questions, email{" "}
              <a href="mailto:billing@theomg.ai">billing@theomg.ai</a>.
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
